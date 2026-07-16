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

    // Site alias file whose `current.uri` names the cluster domain that
    // ${ENVIRONMENT}/${PROJECT} get resolved against.
    private const SELF_ALIAS_FILE = 'drush/sites/self.site.yml';

    // Max total hostname length Silta's Helm chart allows for the
    // "<environment>.<project>.<clusterDomain>" subdomain.
    // @see https://github.com/wunderio/charts/blob/master/drupal/templates/_domains.tpl
    private const SILTA_MAX_HOSTNAME_LENGTH = 62;

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
        if ($context === null || !$this->siteAliasManager instanceof SiteAliasManagerInitializationInterface) {
            // Keep Drush usable in non-git/non-CI contexts, or when the
            // injected manager doesn't support setting reference data.
            return;
        }

        $this->siteAliasManager->setReferenceData($this->getConfig()->export() + $context);
        $this->refreshSelfAlias($this->siteAliasManager);
    }

    /**
     * Resolve reference context values used by site aliases.
     *
     * @return array<string, string>|null
     *   Context values or NULL if repository cannot be resolved.
     */
    private function resolveReferenceContext(): ?array {
        if ($this->runGit('git rev-parse --is-inside-work-tree') !== 'true') {
            // Not a git repository/shell at all: nothing to resolve, and
            // nothing to warn about either.
            return NULL;
        }

        $remote_url = $this->runGit('git config --get remote.origin.url');
        if ($remote_url === null) {
            $this->notice('no git remote "origin" configured, skipping alias resolution.');
            return NULL;
        }

        $repository_name = $this->extractRepositoryNameFromUrl($remote_url);
        if ($repository_name === null) {
            $this->notice(sprintf('could not determine repository name from remote "%s".', $remote_url));
            return NULL;
        }

        $branch_name = $this->runGit('git rev-parse --abbrev-ref HEAD');
        if ($branch_name === null) {
            $this->notice('could not determine current git branch, skipping alias resolution.');
            return NULL;
        }

        $cluster_domain = $this->getClusterDomain();
        if ($cluster_domain === null) {
            $this->notice(sprintf('could not determine cluster domain from "%s".', self::SELF_ALIAS_FILE));
            return NULL;
        }

        $project_name = $this->getProjectName() ?? $repository_name;
        $project_name = $this->normalizeSiltaName($project_name, 30);

        $max_environment_length = self::SILTA_MAX_HOSTNAME_LENGTH - strlen($cluster_domain) - strlen($project_name);
        $environment_name = $this->normalizeSiltaName($branch_name, $max_environment_length);

        return [
            'ENVIRONMENT' => $environment_name,
            'REPOSITORY' => $repository_name,
            'PROJECT' => $project_name,
        ];
    }

    /**
     * Log a notice, if a logger is available yet.
     *
     * PRE_INITIALIZE fires before Drush's logger is guaranteed to be wired
     * up, so logger() can still be NULL here.
     *
     * @param string $message
     *   Message to log, prefixed for context.
     */
    private function notice(string $message): void {
        $this->logger()?->notice('Silta alias: ' . $message);
    }

    /**
     * Reload @self alias if host interpolation placeholders remain.
     *
     * @param \Consolidation\SiteAlias\SiteAliasManagerInterface&\Consolidation\SiteAlias\SiteAliasManagerInitializationInterface $manager
     *   Site alias manager, already narrowed by the caller.
     */
    private function refreshSelfAlias(SiteAliasManagerInterface&SiteAliasManagerInitializationInterface $manager): void {
        // Preflight may have cached @self before reference data was set.
        // Reload it so SSH hostnames use the resolved values.
        $self = $manager->getSelf();
        $host = $self->get('host');
        if (!is_string($host) || !str_contains($host, '${')) {
            return;
        }

        $resolved = $manager->get($self->name());
        if ($resolved !== false) {
            $manager->setSelf($resolved);
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
     * Handles both URL-style (https://host/org/repo.git) and SCP-style
     * (git@host:org/repo.git) remotes.
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

        $path = parse_url($normalized, PHP_URL_PATH) ?: str_replace(':', '/', $normalized);
        $repo_name = trim(basename($path, '.git'));

        return $repo_name !== '' ? $repo_name : NULL;
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
        $project_name = $this->parseYamlFile(self::SILTA_CONFIG_FILE)['projectName'] ?? NULL;
        return is_string($project_name) ? $project_name : NULL;
    }

    /**
     * Get the cluster domain the `current` alias resolves against.
     *
     * Parses `current.uri` in drush/sites/self.site.yml, e.g.
     * "https://${ENVIRONMENT}.${PROJECT}.dev.wdr.io", and strips the
     * ${ENVIRONMENT}/${PROJECT} placeholders to leave the real domain.
     *
     * @return string|null
     *   Cluster domain, or NULL if it can't be determined.
     */
    private function getClusterDomain(): ?string {
        $uri = $this->parseYamlFile(self::SELF_ALIAS_FILE)['current']['uri'] ?? NULL;
        $host = is_string($uri) ? parse_url($uri, PHP_URL_HOST) : NULL;
        if (!is_string($host)) {
            return NULL;
        }

        $prefix = '${ENVIRONMENT}.${PROJECT}.';
        $domain = str_starts_with($host, $prefix) ? substr($host, strlen($prefix)) : $host;

        return $domain !== '' ? $domain : NULL;
    }

    /**
     * Parse a YAML file, if it exists.
     *
     * @param string $path
     *   Path to the file, relative to the repository root.
     *
     * @return array<mixed>
     *   Parsed content, or an empty array if missing/unparseable.
     */
    private function parseYamlFile(string $path): array {
        if (!is_file($path)) {
            return [];
        }

        $file_contents = file_get_contents($path);
        if ($file_contents === false) {
            return [];
        }

        $parsed = Yaml::parse($file_contents);
        return is_array($parsed) ? $parsed : [];
    }

}
