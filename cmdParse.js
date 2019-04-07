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
const { Transform } = require('stream');

const helpParser = require('help-parser');


class CommandPipe extends Transform {
  /**
   * Creates an instance of CommandPipe.
   * @param  {Array} cmds
   * @param  {Object} opts
   * @memberof CommandPipe
   */
  constructor(cmds, opts) {
    super(opts);

    this.cmds = cmds;
    this.cmdIdx = 0;
    this.helpArr = [];

    this.writeReady = false;
  }

  _transform(chunk, enc, cb) {
    const help = chunk.toString();

    const cmd = this.cmds[this.cmdIdx];
    this.helpArr.push(helpParser(help, cmd));

    this.cmdIdx++;
    if (this.cmdIdx === this.cmds.length) {
      this.emit('done', this.helpArr);
    }
    this.emit('ready');
    cb();
  }
}

function run(location) {
  return new Promise((resolve, reject) => {
    const text = fs.readFileSync(location, { encoding: 'utf8' });
    const cmdArr = text.split('\n');

    let left = 0;
    const child = cp.spawn('sh');
    child.stdin.setEncoding('utf8');
    child.ref();

    child.on('error', (err) => {
      console.log(err);
      reject(err);
    });

    const cmdPipe = new CommandPipe(cmdArr, { encoding: 'utf8' });
    child.stdout.pipe(cmdPipe);

    cmdPipe.on('done', (helps) => {
      child.kill();
      resolve(helps);
    });

    cmdPipe.on('ready', () => {
      left++;
      const cmdEcho = `echo "\`${cmdArr[left]} --help\`"\n`;
      child.stdin.write(cmdEcho, (err) => {
        if (err) console.log(`write error: ${err}`);
      });
    });

    const cmdEcho = `echo "\`${cmdArr[0]} --help\`"\n`;
    child.stdin.write(cmdEcho, (err) => {
      if (err) console.log(`write error: ${err}`);
    });
  });
}

run('./worker/a.txt').then((helps) => {
  console.log(helps[helps.length - 1]);
});
