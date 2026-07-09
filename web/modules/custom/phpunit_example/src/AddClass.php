<?php

declare(strict_types=1);

namespace Drupal\phpunit_example;

/**
 * A class with features to show how to do unit testing.
 *
 * @ingroup phpunit_example
 */
final class AddClass {

  /**
   * A simple addition method with validity checking.
   *
   * The parameters are typed as `mixed` (rather than `int|float`) on
   * purpose, so that non-numeric values reach the validity check below and
   * trigger an \InvalidArgumentException instead of a \TypeError.
   *
   * @param mixed $a
   *   A number to add.
   * @param mixed $b
   *   Another number to add.
   *
   * @return int|float
   *   The sum of $a and $b.
   *
   * @throws \InvalidArgumentException
   *   If either $a or $b is non-numeric, we can't add, so we throw.
   */
  public function add(mixed $a, mixed $b): int|float {
    // Check whether the arguments are numeric.
    foreach ([$a, $b] as $argument) {
      if (!is_numeric($argument)) {
        throw new \InvalidArgumentException('Arguments must be numeric.');
      }
    }
    return $a + $b;
  }

}
