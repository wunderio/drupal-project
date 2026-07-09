<?php

namespace Drush\Commands;

use Consolidation\AnnotatedCommand\AnnotationData;
use Consolidation\AnnotatedCommand\Hooks\HookManager;
use Consolidation\SiteAlias\SiteAliasManagerInitializationInterface;
use Consolidation\SiteAlias\SiteAliasManagerInterface;
use Drush\Attributes as CLI;
use Drush\Boot\DrupalBootLevels;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Yaml\Yaml;

/**
 * Class SiltaAliasAlterCommands.
 *
 * @package Drush\Commands
 */
#[CLI\Bootstrap(DrupalBootLevels::NONE)]
class SiltaAliasAlterCommands extends DrushCommands {

    use AutowireTrait;

    private const SILTA_CONFIG_FILE = 'silta/silta.yml';

    public function __construct(
        private readonly SiteAliasManagerInterface $siteAliasManager,
    ) {
        parent::__construct();
    }

    /**
     * Alter feature alias.
     *
     * Silta generates environment URLs and hostnames dynamically based on the
     * branch name. This attempts to mimic the same behaviour in order to
     * dynamically target the specific Silta environment of the branch you're on.
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input
     *   Input interface instance.
     * @param \Consolidation\AnnotatedCommand\AnnotationData $annotationData
     *   Annotation data.
     */
    #[CLI\Hook(type: HookManager::PRE_INITIALIZE, target: '*')]
    public function alter(InputInterface $input, AnnotationData $annotationData): void {
        $context = $this->resolveReferenceContext();
        if ($context === null) {
            // Keep Drush usable in non-git/non-CI contexts.
            return;
        }

        if (!$this->siteAliasManager instanceof SiteAliasManagerInitializationInterface) {
            return;
        }

        $this->siteAliasManager->setReferenceData($this->getConfig()->export() + $context);
        $this->refreshSelfAlias();
    }

    /**
     * Resolve reference context values used by site aliases.
     *
     * @return array<string, string>|null
     *   Context values or NULL if repository cannot be resolved.
     */
    private function resolveReferenceContext(): ?array {
        $remote_url = $this->runGit('git config --get remote.origin.url');
        if ($remote_url === null) {
            return NULL;
        }

        $repository_name = $this->extractRepositoryNameFromUrl($remote_url);
        if ($repository_name === null) {
            return NULL;
        }

        $branch_name = $this->runGit('git rev-parse --abbrev-ref HEAD');
        if ($branch_name === null) {
            return NULL;
        }

        $environment_name = $this->normalizeSiltaName($branch_name, 64);
        $project_name = $this->getProjectName() ?? $repository_name;
        $project_name = $this->normalizeSiltaName($project_name, 30);

        return [
            'ENVIRONMENT' => $environment_name,
            'REPOSITORY' => $repository_name,
            'PROJECT' => $project_name,
        ];
    }

    /**
     * Reload @self alias if host interpolation placeholders remain.
     */
    private function refreshSelfAlias(): void {
        // Preflight may have cached @self before reference data was set.
        // Reload it so SSH hostnames use the resolved values.
        $self = $this->siteAliasManager->getSelf();
        $host = $self->get('host');
        if (!is_string($host) || !str_contains($host, '${')) {
            return;
        }

        $resolved = $this->siteAliasManager->get($self->name());
        if ($resolved !== false && $this->siteAliasManager instanceof SiteAliasManagerInitializationInterface) {
            $this->siteAliasManager->setSelf($resolved);
        }
    }

    /**
     * Run git command quietly.
     *
     * @param string $command
     *   Command to run.
     *
     * @return string|null
     *   Trimmed output or NULL on failure.
     */
    private function runGit(string $command): ?string {
        $output = shell_exec($command . ' 2>/dev/null');
        if (!is_string($output)) {
            return NULL;
        }

        $output = trim($output);
        return $output !== '' ? $output : NULL;
    }

    /**
     * Extract repository name from common git URL formats.
     *
     * @param string $repository_url
     *   The repository URL.
     *
     * @return string|null
     *   Extracted repository name or NULL when it cannot be determined.
     */
    private function extractRepositoryNameFromUrl(string $repository_url): ?string {
        $normalized = trim($repository_url);
        if ($normalized === '') {
            return NULL;
        }

        $normalized = str_replace(':', '/', $normalized);
        $parts = array_values(array_filter(explode('/', $normalized), static fn (string $value): bool => $value !== ''));
        if ($parts === []) {
            return NULL;
        }

        $repo_name = end($parts);
        if (!is_string($repo_name)) {
            return NULL;
        }

        return $this->sanitizeRepositoryName($repo_name);
    }

    /**
     * Normalize repository name.
     *
     * @param string $repository_name
     *   Repository name.
     *
     * @return string|null
     *   Normalized name or NULL if empty.
     */
    private function sanitizeRepositoryName(string $repository_name): ?string {
        $repository_name = trim($repository_name);
        if ($repository_name === '') {
            return NULL;
        }

        $repository_name = preg_replace('/\.git$/', '', $repository_name) ?? $repository_name;
        return $repository_name !== '' ? $repository_name : NULL;
    }

    /**
     * Normalize a Silta-style name with lowercasing, dash substitution and
     * length-aware hash suffixing.
     *
     * @param string $value
     *   Input value.
     * @param int $max_length
     *   Maximum length before hash suffixing.
     *
     * @return string
     *   Normalized name.
     *
     * @see https://github.com/wunderio/charts/blob/master/drupal/templates/_domains.tpl
     */
    private function normalizeSiltaName(string $value, int $max_length): string {
        $normalized = preg_replace('/[^\da-z]/i', '-', $value);
        if ($normalized === null) {
            $normalized = $value;
        }

        $normalized = strtolower(trim($normalized, '-'));
        if ($normalized === '') {
            return '';
        }

        if (strlen($normalized) >= $max_length) {
            $hash = substr(hash('sha256', $normalized), 0, 3);
            $normalized = substr($normalized, 0, max(0, $max_length - 3)) . $hash;
        }

        return $normalized;
    }

    /**
     * Get project name.
     *
     * Attempts to read Silta project name form silta.yml file.
     *
     * @return string|null
     *   Silta project name or NULL.
     */
    private function getProjectName(): ?string {
        if (!is_file(self::SILTA_CONFIG_FILE)) {
            return NULL;
        }

        $file_contents = file_get_contents(self::SILTA_CONFIG_FILE);
        if ($file_contents === false) {
            return NULL;
        }

        $silta_config = Yaml::parse($file_contents);
        if (is_array($silta_config) && isset($silta_config['projectName']) && is_string($silta_config['projectName'])) {
            return $silta_config['projectName'];
        }

        return NULL;
    }

}
