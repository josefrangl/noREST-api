// require apis model


const checkDuplicateFields = async (data) => {

  const fieldsKeysArr = [];
  const fieldsArrCopy = data.api.fields.slice();

  fieldsArrCopy.forEach(field => {
    fieldsKeysArr.push(field.field_name);
  });

  for (let i = 0; i < fieldsKeysArr.length; i++) {
    let value = fieldsKeysArr.pop();
    if (fieldsKeysArr.includes(value)) return true;
  }

  return false;
  // if duplicates return true
  // else return false

};

module.exports = checkDuplicateFields;