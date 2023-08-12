import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { MAIN } from './index.js';

const buildCommand = 'yarn build'; // 替换为实际的构建命令


export function watchFolder(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach(file => {
      const fullPath = path.join(folderPath, file);

      fs.stat(fullPath, (err, stats) => {
        if (err) {
          console.error(err);
          return;
        }

        if (stats.isDirectory()) {
          watchFolder(fullPath); // 递归遍历子目录
        } else {
          fs.watchFile(fullPath, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
              console.log(`fullPath: ', ${folderPath}, File ${file} has changed. Do something here.`); // 在文件变化时执行操作

              // 执行yarn build 命令
              exec(buildCommand, (err, stdout, stderr) => {
                console.log('err: ', err);
                if (err) {
                  console.error(err);
                  return;
                }
              });
            }
          });
        }
      });
    });
  });
}

exec(buildCommand)
watchFolder(`${MAIN}`);
