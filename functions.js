const generateRandomString = () => {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for(let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const emailCheck = (object, str) => {
  for(let key in object) {
    if(object[key].email === str) {
      return true;
    }
  }
  return false;
}

const getUserID = (object, str) => {
  for(let key in object) {
    if(object[key].email === str) {
      return key;
    }
  }
  return false;
}

const urlsForUser = (object, id) => {
  let matches = {};
  for(let key in object) {
    if(object[key].userID === id) {
      matches[key] = object[key];
    }
  }
  return matches;
}

module.exports = {
  generateStr : generateRandomString,
  emailCheck : emailCheck,
  getUserID : getUserID,
  urlsForUser : urlsForUser
}
