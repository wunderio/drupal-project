<?php
function adminer_object()
{

  class AdminerSoftware extends Adminer
  {

    public function credentials()
    {
      // server, username and password for connecting to database
      return array('database', 'drupal10', 'drupal10');
    }

    public function login($login, $password)
    {
      // don't validate credentials submitted via form
      return true;
    }

  }

  return new AdminerSoftware;
}

include_once './adminer.php';
