#!/Users/simonmcallister/.nvm/versions/node/v16.17.1/bin/node

import AWS from "aws-sdk";
import { createHmac } from "crypto";
import CryptoJS from "crypto-js";
import Base64 from "crypto-js/enc-base64.js";
import HmacSHA256 from "crypto-js/hmac-sha256.js";
import {
  generateSmallA,
  calculateA,
  computeHkdf,
  calculateU,
  calculateS,
  calculateX,
  getPasswordAuthenticationKey,
  getNowString,
  G,
} from "./lib.js";

const username = "ec722fc9-d9fb-4aad-8ad6-9d13d2fa04b2";
const password = "Qwerty2!";
const clientId = "3knom04d9ssgmocjoita30ivcf";
const clientSecret = "1em5gq25sets9nrs274pobipek9rnchjlvkh4dutn1gthnd2kddn";
const poolId = "aX79LEgK5";
// const a = 11746154
// const A = 2812966916301730226960422340543001216776923679890054501159104711365272917555887136332506017763190425467254967559963486500124866057878627792455488573703463770689816231454384312372372772673022079132102002110916478536121851801763607535403227556717967791068635348725485572446013449171652781095466578955601351801320427290793176598883802175699266010637607128940095765434244537990554507115488751374863142642997175759860147744056867934367189457517794817283531441496812794357179343984057745336780333394225623342093817559807197684775583620711805047514838120254635592166716011601448251835676649347754918258577388819441139921260815351545676117600511487662349531172783291386337696739128961023390523138300715614392733103700615271524490183951011199713054550599154135584572572865706359790052293049827310974325306297133279729811986159043992794019025971878120943069804873294758318164197925445270738693555341715612072608532864391440399896355558
// const salt = 'bfa6e237b090b60926e67ee01dd969e6'
// const big_n = 5809605995369958062791915965639201402176612226902900533702900882779736177890990861472094774477339581147373410185646378328043729800750470098210924487866935059164371588168047540943981644516632755067501626434556398193186628990071248660819361205119793693985433297036118232914410171876807536457391277857011849897410207519105333355801121109356897459426271845471397952675959440793493071628394122780510124618488232602464649876850458861245784240929258426287699705312584509625419513463605155428017165714465363094021609290561084025893662561222573202082865797821865270991145082200656978177192827024538990239969175546190770645685893438011714430426409338676314743571154537142031573004276428701433036381801705308659830751190352946025482059931306571004727362479688415574702596946457770284148435989129632853918392117997472632693078113129886487399347796982772784615865232621289656944284216824611318709764535152507354116344703769998514148343807
// const B = 'be22b810dad352ff311271128fcb7f3abaa23bb95733972128cc7653fcbd6500724fff66fc4236080ad84c3e0b67254c5959aed296f160f3b6298ebb86b7c8a97f64d637cb69685f330f39b6d53bc641efc42bd50ab9e7feac966fde38699c2e568f60289147a4bdbacd295457fed6ec9d4663880ec1ed9e2857d59c63febbc68d4fa4be8621f0b7ff640669b5d3d67e13f75b2fe130b15eeac8083f736ff7c625b0dc29b4c03cb9ff4adfdc04c97eef30398e912802f556a1500505471aba28af28ef6b2d855e4691a4d7a2a1b3273d3232aff8f32c4ade38a90616ceb8a252cf8ae887cc2790dadc7e85837e7c9f137a11052640d5f611382820a8cd27060100392f0bbe9ab35852837e572515569203fc38b8691d8a825c1fe647365a50e1aab439bcc1185120611a0b1424238f917cfd73dc7cbfc79db8176ac65673323fcf888fe0e0195922d97343129193828b803ae363c66903c581b8d56a39aef49beb9f5041e82009216c745d93866b11496cd538fa52fd27228c6b96a1a12170bd'

const cognitoIdentityClient = new AWS.CognitoIdentityServiceProvider({
  region: "eu-west-2",
});

const createSecretHash = (data, secret) =>
  createHmac("SHA256", secret).update(data).digest("base64");
const secretHash = createSecretHash(`${username}${clientId}`, clientSecret);

(async () => {
  const a = generateSmallA();
  const A = calculateA(a);

  const initiateAuthResponse = await cognitoIdentityClient
    .adminInitiateAuth({
      AuthFlow: "CUSTOM_AUTH",
      AuthParameters: {
        USERNAME: username,
        SECRET_HASH: secretHash,
        CHALLENGE_NAME: "SRP_A",
        SRP_A: A.toString(16),
      },
      ClientId: clientId,
    })
    .promise()
    .catch((err) => {
      console.error(err);
    });

  console.log("-- initiateAuthResponse --");
  console.log(JSON.stringify(initiateAuthResponse));

  const { SALT, SECRET_BLOCK, SRP_B, USERNAME, USER_ID_FOR_SRP } =
    initiateAuthResponse.ChallengeParameters;

  const timestamp = getNowString();
  const hkdf = getPasswordAuthenticationKey(
    username,
    password,
    poolId,
    a,
    A,
    SRP_B,
    SALT
  );

  const message = CryptoJS.lib.WordArray.create(
    Buffer.concat([
      Buffer.from(poolId, "utf8"),
      Buffer.from(username, "utf8"),
      Buffer.from(SECRET_BLOCK, "base64"),
      Buffer.from(timestamp, "utf8"),
    ])
  );
  const key = CryptoJS.lib.WordArray.create(hkdf);
  const signatureString = Base64.stringify(HmacSHA256(message, key));

  const respondToPasswordChallengeResponse = await cognitoIdentityClient
    .respondToAuthChallenge({
      ClientId: clientId,
      ChallengeName: "PASSWORD_VERIFIER",
      ChallengeResponses: {
        TIMESTAMP: timestamp,
        USERNAME: username,
        PASSWORD_CLAIM_SECRET_BLOCK: SECRET_BLOCK,
        PASSWORD_CLAIM_SIGNATURE: signatureString,
        SECRET_HASH: secretHash,
      },
      Session: initiateAuthResponse.Session,
    })
    .promise()
    .catch((err) => {
      console.error(err);
    });

  console.log("-- respondToPasswordChallengeResponse --");
  console.log(JSON.stringify(respondToPasswordChallengeResponse));

  const respondToOTPChallengeResponse = await cognitoIdentityClient
    .respondToAuthChallenge({
      ClientId: clientId,
      ChallengeName: "CUSTOM_CHALLENGE",
      ChallengeResponses: {
        ANSWER: "4",
        USERNAME: username,
        SECRET_HASH: secretHash,
      },
      Session: respondToPasswordChallengeResponse.Session,
    })
    .promise()
    .catch((err) => {
      console.error(err);
    });

  console.log("-- respondToOTPChallengeResponse --");
  console.log(JSON.stringify(respondToOTPChallengeResponse));

  const respondToOTPChallengeResponse2 = await cognitoIdentityClient
    .respondToAuthChallenge({
      ClientId: clientId,
      ChallengeName: "CUSTOM_CHALLENGE",
      ChallengeResponses: {
        ANSWER: "5",
        USERNAME: username,
        SECRET_HASH: secretHash,
      },
      ClientMetadata: {
        Foo: "bar",
      },
      Session: respondToOTPChallengeResponse.Session,
    })
    .promise()
    .catch((err) => {
      console.error(err);
    });

  console.log("-- respondToOTPChallengeResponse2 --");
  console.log(JSON.stringify(respondToOTPChallengeResponse));
})();

// const response = await cognitoIdentityClient
//     .initiateAuth({
//         AuthFlow: 'CUSTOM_AUTH',
//         AuthParameters: {
//             USERNAME: username,
//             SECRET_HASH: secretHash,
//             CHALLENGE_NAME: 'SRP_A',
//             SRP_A: clientEphemeral.public
//         },
//         ClientId: clientId,
//     })
//     .promise()
//     .catch((err) => {
//         console.error(err);
//     });

// console.log('v')
// console.log(v)
