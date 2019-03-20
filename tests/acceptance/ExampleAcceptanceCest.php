<?php

class ExampleAcceptanceCest {

  /**
   * @param \AcceptanceTester $i
   */
  public function exampleAcceptanceTest(AcceptanceTester $i) {
    $i->amOnPage('/');
    $i->loginWithRole('authenticated');
  }

}
