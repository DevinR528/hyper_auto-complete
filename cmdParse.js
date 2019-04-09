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
const { Transform, Writable } = require('stream');

const helpParser = require('help-parser');


class CommandPipe extends Writable {
  /**
   * Creates an instance of CommandPipe.
   * @param  {Array} cmds
   * @param  {Object} opts
   * @memberof CommandPipe
   */
  constructor(cmds, opts) {
    super(opts);

    this.cmds = Array.from(new Set(cmds));
    this.cmdIdx = 0;
    this.helpArr = [];

    this.buffer = '';
  }

  _write(chunk, enc, cb) {
    const help = chunk.toString();
    // end of help symbol
    if (help.includes('EOH00')) {
      this.buffer += help.replace('EOH00\n', '');
      const cmd = this.cmds[this.cmdIdx];
      this.helpArr.push(helpParser(this.buffer, cmd));

      this.cmdIdx++;
      if (this.cmdIdx === this.cmds.length) {
        this.emit('done', this.helpArr);
      } else {
        this.buffer = '';
        this.emit('ready', this.cmdIdx);
      }
    } else {
      this.buffer += help;
    }
    cb();
  }
}

function run(location) {
  return new Promise((resolve, reject) => {
    const text = fs.readFileSync(location, { encoding: 'utf8' });
    const cmdArr = text.split('\n');

    const cmdPipe = new CommandPipe(cmdArr);

    const child = cp.spawn('bash');
    child.stdin.setEncoding('utf8');
    child.stdout.setEncoding('utf8');
    child.ref();

    // this is the driving
    // try dev/null try ref or pause or resume in class
    // check getting stderr to stdout for parsing that
    child.stdout.pipe(cmdPipe);

    child.on('error', (err) => {
      console.log(err);
      reject(err);
    });

    child.stdin.on('error', (err) => {
      if (err.code === 'EPIPE') {
        console.log('epipe');
        resolve(cmdPipe.helpArr);
      }
    });

    child.stdout.on('error', (err) => {
      console.log(`child.stdout: ${err}`);
    });

    cmdPipe.on('error', (err) => {
      console.log(`cmdPipe: ${err}`);
      reject(err);
    });

    cmdPipe.on('ready', (idx) => {
    //                                      end of help symbol
      const cmdEcho = `echo "\`${cmdArr[idx]} --help\`";echo EOH00\n`;
      child.stdin.write(cmdEcho);
    });

    cmdPipe.on('done', (helps) => {
      child.stdout.unpipe();
      child.kill();
      child.unref();
      resolve(helps);
    });

    //                                      end of help symbol
    const cmdEcho = `echo "\`${cmdArr[0]} --help\`";echo EOH00\n`;
    child.stdin.write(cmdEcho);
  });
}

run('./worker/cmds.txt').then((helps) => {
  // console.log(helps);
  console.log(helps.length);
}).catch(err => console.log(err));

