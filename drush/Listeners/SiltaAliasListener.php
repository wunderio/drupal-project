<?php

namespace Drush\Listeners;

use Consolidation\SiteAlias\SiteAliasManagerInterface;
use Drush\Attributes as CLI;
use Drush\Boot\DrupalBootLevels;
use Drush\Commands\AutowireTrait;
use Drush\Drush;
use Drush\Event\ConsoleDefinitionsEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Yaml\Yaml;

/**
 * Fills the Silta site aliases from git and silta.yml.
 *
 * Silta generates environment URLs and hostnames dynamically based on the
 * branch name. This attempts to mimic the same behaviour in order to
 * dynamically target the specific Silta environment of the branch you're on.
 *
 * It listens on ConsoleDefinitionsEvent, which fires once the command files
 * are loaded and before any command runs. A command hook would miss remote
 * commands that don't exist locally (config:status, sqlq, ws...): Drush runs
 * those through a RemoteCommandProxy, which has no hooks, and the alias would
 * keep its ${REPOSITORY} placeholder.
 */
#[AsEventListener]
#[CLI\Bootstrap(level: DrupalBootLevels::NONE)]
class SiltaAliasListener {

    use AutowireTrait;

    /**
     * Whether the aliases are filled already.
     *
     * The event fires again on a full Drupal bootstrap.
     */
    private bool $done = FALSE;

    public function __construct(
        private readonly SiteAliasManagerInterface $siteAliasManager,
    ) {
    }

    /**
     * Fills ENVIRONMENT, REPOSITORY and PROJECT in the aliases.
     */
    public function __invoke(ConsoleDefinitionsEvent $event): void {
        if ($this->done || !$this->isGitAvailable()) {
            return;
        }
        $this->done = TRUE;

        // Get branch name we're currently on.
        $branch = exec('git rev-parse --abbrev-ref HEAD');

        $environment_name = $this->prepareEnvironmentName($branch);
        $repository_name = exec('basename -s .git `git config --get remote.origin.url`');
        $project_name = $this->getProjectName();

        // If project name is not explicitly set in silta.yml then we use the
        // default - repository name.
        if (is_null($project_name)) {
            $project_name = $repository_name;
        }

        $this->siteAliasManager->setReferenceData(Drush::config()->export() + [
            'ENVIRONMENT' => $environment_name,
            'REPOSITORY' => $repository_name,
            'PROJECT' => $project_name,
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
        return shell_exec('command -v git 2>/dev/null') !== NULL;
    }

    /**
     * Prepare environment name to be used in the alias.
     *
     * Mimic what Silta does - replace all non-alphanumeric characters with
     * dahses to create environment name.
     *
     * @param string $branch
     *   Git branch name.
     *
     * @return string
     *   Environment name matching what Silta has generated.
     *
     * @see https://github.com/wunderio/charts/blob/master/drupal/templates/_domains.tpl#L4
     */
    private function prepareEnvironmentName(string $branch) {

        $environment_name = preg_replace('/[^\da-z]/i', '-', $branch);

        // If environment name exceeds 64 then we trim it to 64 chars and add
        // first chars for sha hash to it.
        if (strlen($environment_name) > 64) {
            $environment_name = substr($environment_name, 0, 64);
            $sha = hash('sha256', $environment_name);
            $prefix = substr($sha, 0, 3);
            $environment_name = $prefix . $environment_name;
        }

        // Finally make it all lowercase and return.
        return strtolower($environment_name);
    }

    /**
     * Get project name.
     *
     * Attempts to read Silta project name form silta.yml file.
     *
     * @return string|null
     *   Silta project name or NULL.
     */
    private function getProjectName() {
        $silta_config_file = 'silta/silta.yml';
        if (file_exists($silta_config_file)) {
            $silta_config = Yaml::parse(file_get_contents($silta_config_file));
            if (isset($silta_config['projectName'])) {
                return $silta_config['projectName'];
            }
        }
        return NULL;
    }

}
