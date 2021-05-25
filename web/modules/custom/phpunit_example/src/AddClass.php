<?php

namespace Drupal\phpunit_example;

/**
 * A class with features to show how to do unit testing.
 *
 * @ingroup phpunit_example
 */
class AddClass {

  /**
   * A simple addition method with validity checking.
   *
   * @param mixed $a
   *   A number to add.
   * @param mixed $b
   *   Another number to add.
   *
   * @return mixed
   *   The sum of $a and $b.
   *
   * @throws \InvalidArgumentException
   *   If either $a or $b is non-numeric, we can't add, so we throw.
   */
  public function add($a, $b) {
    // Check whether the arguments are numeric.
    foreach ([$a, $b] as $argument) {
      if (!is_numeric($argument)) {
        throw new \InvalidArgumentException('Arguments must be numeric.');
      }
    }
    return $a + $b;
  }

}
