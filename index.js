const fs = require('fs-extra');


let _currentCommand = null;

exports.middleware = store => next => (action) => {
  if (action.type === 'SESSION_ADD_DATA') {
    const { data } = action;
    store.dispatch({
      type: 'AUTO_COMPLETE',
      data,
      effect() {
        _currentCommand = data;
        // console.log(_currentCommand);
      }
    });
    next(action);
  } else {
    next(action);
  }
};

exports.reduceUI = (state, action) => {
  switch (action.type) {
    case 'AUTO_COMPLETE':
      return state.set('autoComp', !state.autoComp);
    default:
      break;
  }

  return state;
};

exports.mapTermsState = (state, map) => Object.assign(map, {
  autoComp: state.ui.autoComp
});

exports.getTermProps = (uid, parentProps, props) => Object.assign(props, {
  autoComp: parentProps.autoComp
});

exports.decorateTerms = (Term, { React, notify }) => class extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.term = null;
    this.commandArr = [];
    this.comStr = '';
    this.line_x = 0;
    this.trigger = false;
    this._onDecorated = this._onDecorated.bind(this);
    this._onData = this._onData.bind(this);
  }

  _onDecorated(term) {
    // Don't forget to propagate it to HOC chain
    if (this.props.onDecorated) this.props.onDecorated(term);
    this.term = term;
  }

  _onData(uid, data) {
    // Don't forget to propagate it to HOC chain
    if (this.props.onData) this.props.onData(uid, data);
    // console.log(data);
    // console.log(_currentCommand);
    this._checkForArrow(data);
    this._makeString(data);
  }

  // ctr shift v = '\x1b' + '[2~'
  _checkForArrow(data) {
    if (data === '\x1b[A') {
      // up arrow
      console.log('poopsup');
    } else if (data === '\x1b[B') {
      // down arrow
      console.log('poopsdown');
    } else if (data === '\x1b[C') {
      // right arrow
      console.log('poopsright');
      if (this.comStr.length > this.line_x) { // check logic
        this.line_x++;
      }
    } else if (data === '\x1b[D') {
      // left arrow
      console.log('poopsleft');
      if (this.line_x < 0) {
        this.line_x--;
      }
    }
  }

  _makeString(data) {
    // this method takes each character from the term input and creates a string out of it and once the command is done it pushes it into an array
    if (data === '\x7f') { // if there is a back space delete it
      this.comStr = this.comStr.slice(this.line_x, this.line_x - 1);
    } else if (data === '\x0d') { // if enter is pressed push the string to an array and clear the buffer string
      this.commandArr.push(this.comStr);
      this.comStr = '';
      this.line_x = 0;
      console.log(this.commandArr);
    } else { // otherwise keep adding to the buffer string
      this.comStr += data;
      this.line_x++;
    }
  }

  render() {
    return React.createElement(
      Term,
      Object.assign({}, this.props, {
        onDecorated: this._onDecorated,
        onData: this._onData,
      })
    );
  }
};
