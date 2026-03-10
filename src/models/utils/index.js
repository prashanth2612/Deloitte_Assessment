const { basename, extname } = require('path');
const path = require('path');
const { globSync } = require('glob');

// __dirname = backend/src/models/utils/
// go up 3 levels to reach backend/
const cwd = path.join(__dirname, '../../../');

const appModelsFiles = globSync('src/models/appModels/**/*.js', { cwd });
const modelsFiles = globSync('src/models/**/*.js', { cwd })
  .filter(f => !f.includes('utils'))
  .map((filePath) => {
    const fileNameWithExtension = basename(filePath);
    const fileNameWithoutExtension = fileNameWithExtension.replace(
      extname(fileNameWithExtension),
      ''
    );
    return fileNameWithoutExtension;
  });

const constrollersList = [];
const appModelsList = [];
const entityList = [];
const routesList = [];

for (const filePath of appModelsFiles) {
  const fileNameWithExtension = basename(filePath);
  const fileNameWithoutExtension = fileNameWithExtension.replace(
    extname(fileNameWithExtension),
    ''
  );
  const firstChar = fileNameWithoutExtension.charAt(0);
  const modelName = fileNameWithoutExtension.replace(firstChar, firstChar.toUpperCase());
  const fileNameLowerCaseFirstChar = fileNameWithoutExtension.replace(
    firstChar,
    firstChar.toLowerCase()
  );
  const entity = fileNameWithoutExtension.toLowerCase();
  const controllerName = fileNameLowerCaseFirstChar + 'Controller';
  constrollersList.push(controllerName);
  appModelsList.push(modelName);
  entityList.push(entity);
  routesList.push({ entity, modelName, controllerName });
}

module.exports = { constrollersList, appModelsList, modelsFiles, entityList, routesList };