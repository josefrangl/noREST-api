

const checkDuplicateFields = data => {

  let fieldsArrCopy = [];

  if (data.api_fields) {
    fieldsArrCopy = data.api_fields.slice();
  } else if (data.api.fields) {
    fieldsArrCopy = data.api.fields.slice();
  }

  const fieldsKeysArr = [];
  fieldsArrCopy.forEach(field => {
    fieldsKeysArr.push(field.field_name);
  });

  for (let i = 0; i < fieldsKeysArr.length; i++) {
    let value = fieldsKeysArr.pop();
    if (fieldsKeysArr.includes(value)) return true;
  }

  return false;
};

module.exports = checkDuplicateFields;
