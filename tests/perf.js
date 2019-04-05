const { PerformanceObserver, performance } = require('perf_hooks');
const Watcher = require('../watcher');

const watch = new Watcher();

const testMakeString = () => {
  watch.comStr = ['a', 'b', 'c', ' ', 'd', 'e', 'v', ' ', 'w'];
  watch.line_x = 9;
  performance.mark('start');

  watch.makeString('d');

  performance.mark('makeString');
  performance.measure('makeString', 'start', 'makeString');
};

const testMakeStringDel = () => {
  watch.comStr = ['a', 'b', 'c', ' ', 'd', 'e', 'v', ' ', 'w'];
  watch.line_x = 7;
  performance.mark('start');

  watch.makeString('\u001b[3~');

  performance.mark('makeStringDel');
  performance.measure('makeStringDel', 'start', 'makeStringDel');
};


const testCtrlBckSp = () => {
  watch.comStr = ['a', 'b', 'c', ' ', 'd', 'e', 'v', ' ', 'w'];
  watch.line_x = 9;
  performance.mark('start');

  watch._ctrlBackspace();

  performance.mark('ctrlBckSp');
  performance.measure('ctrlBckSp', 'start', 'ctrlBckSp');
};

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((val) => {
    console.log(`name: ${val.name} | duration: ${val.duration}`);
  });
});

obs.observe({ entryTypes: ['measure'] });

performance.mark('start');
(function main() {
  performance.timerify(testCtrlBckSp)();
  performance.timerify(testMakeString)();
  performance.timerify(testMakeStringDel)();
}());
