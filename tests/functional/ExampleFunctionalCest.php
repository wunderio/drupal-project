<?php

class ExampleFunctionalCest
{

  /**
   * @param \FunctionalTester $I
   */
    public function exampleFunctionalTest(FunctionalTester $I)
    {
        $I->amOnPage('/');
        $I->seeResponseCodeIs(200);
    }
}
