import type { Reporter } from '@playwright/test/reporter';

const isInteractiveDdevRun = () =>
  process.env.IS_DDEV_PROJECT === 'true' && !process.env.CI && !!process.stdin.isTTY;

/**
 * Inside DDEV, replaces the HTML reporter's "npx playwright show-report" hint
 * with "ddev playwright-report". On the host, that npx command fails because
 * DDEV already exposes the report port (9323) there.
 */
export default class DdevReportHintReporter implements Reporter {
  private showHint = false;

  printsToStdio() {
    return false;
  }

  onEnd() {
    this.showHint = isInteractiveDdevRun();
    if (this.showHint) {
      // The HTML reporter prints its hint in onExit only when stdin is a TTY,
      // and Playwright runs every reporter's onEnd before any onExit.
      // Both are Playwright internals, checked against @playwright/test 1.59.1:
      // re-check after an upgrade if the npx hint comes back.
      process.stdin.isTTY = false;
    }
  }

  async onExit() {
    if (this.showHint) {
      console.log('\nTo open last HTML report run:\n\n  ddev playwright-report\n');
    }
  }
}
