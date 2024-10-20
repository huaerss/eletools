import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

let config: any = Object;

if (app.isPackaged) {
  const configPath = join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'config.json');
  const data = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(data);

} else {
  const appPath = app.getAppPath()
  const configPath = join(appPath, 'resources', 'config.json');
  const data = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(data);
}
export default config;
