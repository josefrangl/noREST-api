const fs = require('fs');
const {promisify} = require('util');
const writeFileAsync = promisify(fs.writeFile);

exports.createModel = async (data) =>  {

  const apiName = data.api.name;
  const modelName = apiName[0].toUpperCase() + apiName.slice(1).toLowerCase();

  const txtImportMongoose = 'const mongoose = require("../../db/mongodb/mongodb.js");\n\n';
  const txtBeginModel = `const ${modelName} = mongoose.model('${apiName}', {\n`;

  let txtMiddleModel = '';

  data.api.fields.forEach(elem => {
    txtMiddleModel +=
      `\t"${elem.field_name}": {
        type: ${elem.field_type},
        allowNull: ${elem.allow_null},
        ${elem.default_value ? 'default: '+ `'${elem.default_value}'`+',' : '' }
        },\n`;
  });

  const txtEndModel = '});\n\n';
  const txtExportModule = `module.exports = ${modelName};`;

  const model = txtImportMongoose + txtBeginModel + txtMiddleModel + txtEndModel + txtExportModule;
  const modelPath = `models/api/${apiName}Model.js`;

  writeFileAsync(modelPath, model, 'utf8', err => {
    // eslint-disable-next-line no-console
    if (err) console.error('error creating model file: ', err);
    // eslint-disable-next-line no-console
    else console.log(`Created Model: '${modelName}', for API: '${apiName}'!`);
  });
  return 'model created';
};