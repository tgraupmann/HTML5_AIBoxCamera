const fs = require('fs');

var classNames = [];

fs.readdir('images', function (err, files) {
  //handling error
  if (err) {
    return console.log('Unable to scan directory:', err);
  }

  for (let f = 0; f < files.length; ++f) {
    let file = files[f];
    console.log('Found:', file);
    classNames.push(file);

  }

  const json = JSON.stringify(classNames, null, 2);
  fs.writeFile('classNames.json', json, 'utf8', function () {
    console.log('File created.')
  });
});
