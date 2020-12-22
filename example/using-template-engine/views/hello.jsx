const React = require('react');

function footer(){
    return <h1>i'm footer</h1>
}

function HelloMessage(props) {
  return (
      <>
        <h1>Hello jsx, {props.name}</h1>
        {footer()}
      </>
  );
}

module.exports = HelloMessage;