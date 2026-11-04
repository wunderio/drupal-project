/* Playwright's "npx playwright show-report" hint does not work in DDEV; add the DDEV command below it. */
export default class {
  onExit() {
    if (process.env.IS_DDEV_PROJECT && process.stdin.isTTY) {
      console.log('  In DDEV, run instead:\n\n  ddev playwright-report\n');
    }
  }
}
