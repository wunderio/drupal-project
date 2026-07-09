<?php

namespace Drupal\Tests\drupal_project\Unit;

use Consolidation\SiteAlias\SiteAliasManagerInterface;
use Drupal\Tests\UnitTestCase;
use Drush\Commands\SiltaAliasAlterCommands;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once dirname(__DIR__, 3) . '/drush/Commands/SiltaAliasAlterCommands.php';

/**
 * Unit tests for Silta alias command helpers.
 */
#[Group('drupal_project')]
class SiltaAliasAlterCommandsTest extends UnitTestCase {

  /**
   * Tests name normalization for Silta environment names.
   */
  #[DataProvider('normalizeSiltaNameProvider')]
  public function testNormalizeSiltaName(string $input, int $maxLength, string $expected): void {
    $command = $this->createCommand();
    $actual = $this->invokePrivateMethod($command, 'normalizeSiltaName', [$input, $maxLength]);

    $this->assertSame($expected, $actual);
  }

  /**
   * Data provider for testNormalizeSiltaName().
   *
   * @return array<int, array<int, int|string>>
   *   Test cases.
   */
  public static function normalizeSiltaNameProvider(): array {
    return [
      ['Feature/ABC-123', 64, 'feature-abc-123'],
      ['release-2026.07.08', 64, 'release-2026-07-08'],
      ['Feature Name With Spaces', 64, 'feature-name-with-spaces'],
      [str_repeat('a', 70), 64, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa6bd'],
    ];
  }

  /**
   * Tests repository name extraction from common git remote URL formats.
   */
  #[DataProvider('repositoryUrlProvider')]
  public function testExtractRepositoryNameFromUrl(string $url, ?string $expected): void {
    $command = $this->createCommand();
    $actual = $this->invokePrivateMethod($command, 'extractRepositoryNameFromUrl', [$url]);

    $this->assertSame($expected, $actual);
  }

  /**
   * Data provider for testExtractRepositoryNameFromUrl().
   *
   * @return array<int, array{0:string, 1:?string}>
   *   URL parsing test cases.
   */
  public static function repositoryUrlProvider(): array {
    return [
      ['git@github.com:wunderio/drupal-project.git', 'drupal-project'],
      ['https://github.com/wunderio/drupal-project.git', 'drupal-project'],
      ['https://github.com/wunderio/drupal-project', 'drupal-project'],
      ['   ', NULL],
    ];
  }

  /**
   * Creates the command under test.
   */
  private function createCommand(): SiltaAliasAlterCommands {
    $site_alias_manager = $this->createMock(SiteAliasManagerInterface::class);
    return new SiltaAliasAlterCommands($site_alias_manager);
  }

  /**
   * Invokes a private method on the command.
   *
   * @param object $object
   *   Object to reflect.
   * @param string $methodName
   *   Name of the private method.
   * @param array<int, mixed> $arguments
   *   Method arguments.
   *
   * @return mixed
   *   Method result.
   */
  private function invokePrivateMethod(object $object, string $methodName, array $arguments = []): mixed {
    $reflection = new \ReflectionClass($object);
    $method = $reflection->getMethod($methodName);
    $method->setAccessible(TRUE);

    return $method->invokeArgs($object, $arguments);
  }

}
