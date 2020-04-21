/**
 * Se ordena la respuesta proveniente del Visual Recognition
 * y se muestran las clases con score sobre 0.02
 *
 * @ansJson {JSON} Respuesta del VR model
 */

function cleanVRres(ansJson) {
  return new Promise(async function(resolve, reject) {
    var response = "";
    //console.log(JSON.stringify(ansJson, null, 2));

    for await (var cls of ansJson.result.images[0].classifiers[0].classes) {
      if (cls.score >= 0.02) {
        response += "\n- " + cls.class;
        console.log("res: " + response);
      }
    }
    resolve(response);
  });
}

module.exports = cleanVRres;
