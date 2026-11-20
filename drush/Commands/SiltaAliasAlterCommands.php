<?php

namespace Drush\Commands;

use Consolidation\AnnotatedCommand\AnnotationData;
use Consolidation\AnnotatedCommand\Hooks\HookManager;
use Consolidation\SiteAlias\SiteAliasManagerInterface;
use Drush\Attributes as CLI;
use Drush\Boot\DrupalBootLevels;
use Symfony\Component\Console\Input\InputInterface;

/**
 * Class SiltaAliasAlterCommands.
 *
 * @package Drush\Commands
 */
#[CLI\Bootstrap(DrupalBootLevels::NONE)]
class SiltaAliasAlterCommands extends DrushCommands {

    use AutowireTrait;

    public function __construct(
        private readonly SiteAliasManagerInterface $siteAliasManager,
    ) {
        parent::__construct();
    }

    /**
     * Fill in the project of the aliases in drush/sites/self.site.yml.
     *
     * ArgoCD deploys the project into a namespace named after the repository,
     * and the drupal chart builds the environment hostname from the project
     * name. Both are derived from the git remote here.
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input
     *   Input interface instance.
     * @param \Consolidation\AnnotatedCommand\AnnotationData $annotationData
     *   Annotation data.
     */
    #[CLI\Hook(type: HookManager::PRE_INITIALIZE, target: '*')]
    public function alter(InputInterface $input, AnnotationData $annotationData) {
        if (!$this->isGitAvailable()) {
            return;
        }

        $repository_name = exec('basename -s .git `git config --get remote.origin.url`');

        $this->siteAliasManager->setReferenceData($this->getConfig()->export() + [
            // The namespace: k8s/*/apps.yaml sets it to the repository name in
            // lowercase.
            'NAMESPACE' => strtolower($repository_name),
            'PROJECT' => $this->prepareProjectName($repository_name),
        ]);

        // Preflight may have cached @self before reference data was set; remote
        // commands (e.g. drush @production uli) use getSelf() for SSH, so reload it.
        $self = $this->siteAliasManager->getSelf();
        $host = $self->get('host');
        if (is_string($host) && str_contains($host, '${')) {
            $resolved = $this->siteAliasManager->get($self->name());
            if ($resolved !== FALSE) {
                $this->siteAliasManager->setSelf($resolved);
            }
        }
    }

    /**
     * Check if git command is available.
     *
     * @return bool
     *   TRUE if git is available, FALSE otherwise.
     */
    private function isGitAvailable(): bool {
        return shell_exec('command -v git 2>/dev/null') !== null;
    }

    /**
     * Prepare the project name used in environment hostnames.
     *
     * Mimic the drupal chart: replace all non-alphanumeric characters with
     * dashes, and shorten names of 30 characters or more to 27 characters
     * plus the first 3 characters of their sha256 hash.
     *
     * @param string $repository_name
     *   Git repository name.
     *
     * @return string
     *   Project name matching the one in the environment hostname.
     *
     * @see https://github.com/wunderio/charts/blob/master/drupal/templates/_domains.tpl
     */
    private function prepareProjectName(string $repository_name): string {
        $project_name = strtolower(preg_replace('/-$/', '', preg_replace('/[^\da-z]/i', '-', $repository_name)));

        if (strlen($project_name) >= 30) {
            $project_name = substr($project_name, 0, 27) . substr(hash('sha256', $project_name), 0, 3);
        }

        return $project_name;
    }

}
