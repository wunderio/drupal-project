<?php

/**
 * Provides autologin mode for the Adminer database tool.
 * @see https://www.adminer.org/en/extension/.
 */

function adminer_object()
{

  class AutoLogin extends Adminer
  {

    public function credentials()
    {
      // Server, username and password for connecting to database.
      return array('database', 'drupal10', 'drupal10');
    }

    public function login($login, $password)
    {
      // Don't validate credentials submitted via form.
      return true;
    }

  }

  return new AutoLogin;
}

include_once './adminer_library.php';
