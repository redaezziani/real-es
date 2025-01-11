class CustomReporter {
  onRunComplete(contexts, results) {
    if (results.numFailedTests === 0) {
      console.log('\nYou are awesome! All tests passed! 🚀\n');
    } else {
      console.log(`\nYou have ${results.numFailedTests} failed tests. 😢\n`);
    }
  }
}

module.exports = CustomReporter;
