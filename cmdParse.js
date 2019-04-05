const cp = require('child_process');
const {
  Worker,
  workerData,
  parentPort,
  MessagePort,
  MessageChannel,
  isMainThread
// eslint-disable-next-line import/no-unresolved
} = require('worker_threads');
const fs = require('fs');

const helpParser = require('help-parser');

/**
   * @function
   * @param {String} command
   * @returns {Promise<Object>}
   */
function cmdParser(command) {
  return new Promise((resolve, reject) => {
    const cmdEcho = `echo "\`${command} --help\`"`;
    cp.exec(cmdEcho, (err, stout, stin) => {
      if (err) {
        console.log(command);
        // we need every element in the promise array to be something
        resolve(null);
      }
      try {
        const helpObj = helpParser(stout, command);
        resolve(helpObj);
      } catch (e) {
        resolve(null);
      }
    });
  });
}

function cmdParserStream(commands) {
  const cmdArr = commands.split('\n');
  const helpArr = [];
  let left = 0;

  const child = cp.spawn('sh');
  child.stdin.setEncoding('utf-8');

  child.on('error', (err) => {
    console.log(err);
  });
  child.stdout.on('data', (chunk) => {
    console.timeLog('cmd finished');
    const command = cmdArr[left];
    left++;
    if (left === cmdArr.length) child.emit('done', helpArr);
    const help = chunk.toString();
    helpArr.push(helpParser(help, command));
  });
  child.on('done', (helps) => {
    console.log(helps[5]);
    child.kill();
  });

  for (let i = 0; i < cmdArr.length; i++) {
    const command = cmdArr[i];
    const cmdEcho = `echo "\`${command} --help\`"\n`;
    child.stdin.write(cmdEcho, (err) => {
      if (err) console.log(`write error: ${err}`);
    });
  }
}

/**
 *
 * @param  {String} commands
 * @return {Promise}
 */
async function genCmdObjects(commands) {
  const cmdArr = commands.split('\n');
  // const node = await cmdParser(commands);
  // console.log(node);
  const done = await Promise.all(cmdArr.map(cmdParser));
  return done;
}

function* writeToChild(cmd, cp) {
  cp.stdin.write(cmdEcho, (err) => {
    if (err) console.log(`write error: ${err}`);
  });
  yield;
}

function* readFromChild(help) {
  yield writeToChild();
}

(function run() {
  const text = fs.readFileSync('./worker/b.txt', { encoding: 'utf8' });
  console.time('end');
  console.time('cmd finished');
  const cmdArr = text.split('\n');
  const helpArr = [];
  let left = 0;

  const child = cp.spawn('sh');
  child.stdin.setEncoding('utf-8');

  child.on('error', (err) => {
    console.log(err);
  });
  child.stdout.on('data', function* dataGen(chunk) {
    console.timeLog('cmd finished');
    const command = cmdArr[left];
    console.log(command);
    left++;

    if (left === cmdArr.length) {
      child.emit('done', helpArr);
    }
    const help = chunk.toString();
    helpArr.push(helpParser(help, command));
    yield writeToChild(command, child);
  });
  child.on('done', (helps) => {
    console.timeEnd('end');
    console.log(helps[5]);
    // child.kill();
  });

  for (let i = 0; i < cmdArr.length; i++) {
    const command = cmdArr[i];
    const cmdEcho = `echo "\`${command} --help\`"\n`;
  }
  // await genCmdObjects(text);
}());
