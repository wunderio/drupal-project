<?php

/**
 * Provides autologin mode for the Adminer database tool.
 * @see https://www.adminer.org/en/extension/.
 */

function adminer_object()
{

  class AutoLogin extends Adminer
  {

    /**
     * Overwrite top left 'logo' link to landing page of Adminer app.
     *
     * By default, it would open link to Adminer home page. Let's also preselect
     * Drupal 10 db.
     */
    function name() {
      return '<a href="' . '/?username=&db=' . getenv('DB_NAME_DRUPAL') . '" id="h1">Adminer</a>';
    }

    /**
     * Overwrite the connection parameters.
     */
    public function credentials()
    {
      // Server, username and password for connecting to database.
      return array(getenv('DB_HOST_DRUPAL'), getenv('DB_USER_DRUPAL'), getenv('DB_PASS_DRUPAL'));
    }

    /**
     * Overwrite the user authorization.
     */
    public function login($login, $password)
    {
      // Don't validate credentials submitted via form.
      return true;
    }

    /**
     * Adjust the original form to autologin and preselect Drupal database.
     */
    function loginForm() {
      ob_start();
      Adminer::loginForm();
      $original_form = ob_get_clean();

      // Preselect Drupal 10 db.
      $original_form = str_replace('name="auth[db]" value=""', 'name="auth[db]" value="' . getenv('DB_NAME_DRUPAL') . '"', $original_form);

      // Add id attribute to the submit button to target it with js in next
      // section.
      $submit_button_id = 'adminer-login-submit-button';
      echo str_replace("type='submit'", "type='submit' id='{$submit_button_id}'", $original_form);

      // Add js to autosubmit the form.
      echo '<script' . nonce(). '>';
      echo 'document.addEventListener("DOMContentLoaded", function() {';
      echo "var submit_button = document.getElementById('{$submit_button_id}');";

      // Check if the submit button is found.
      echo 'if (submit_button) {';
      // Trigger a click event on the submit button to submit the form';
      echo 'submit_button.click();';
      echo '}';
      echo '});';
      echo '</script>';
    }

  }

  return new AutoLogin;
}

include_once './adminer_library.php';
