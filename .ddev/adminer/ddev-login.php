<?php
// #ddev-generated
class DDEVLogin {
    function loginForm() {
    ?>
        <script type="text/javascript" <?php echo nonce(); ?>>
        addEventListener('load', function () {
            // Prevent infinite reload loop when auto login failed.
            if (document.querySelector('.error')) {
                return
            }
            let dbimage = '<?php echo $_ENV["DDEV_DBIMAGE"] ?>'
            // Default driver is mysql ("server"). We don't want to set it if that's the case.dbimage
            // The only other currently supported driver is pgsql
            if (!dbimage.includes('mariadb') && !dbimage.includes('mysql')) {
                document.querySelector('[name="auth[driver]"]').value = "pgsql"
            }
            document.querySelector('[name="auth[db]"]').value = '<?php echo $_ENV['DDEV_DB_NAME']; ?>'
            document.querySelector('[name="auth[username]"]').value = '<?php echo $_ENV['DDEV_DB_USER']; ?>'
            document.querySelector('[name="auth[password]"]').value = '<?php echo $_ENV['DDEV_DB_PASS']; ?>'
            document.querySelector('[name="auth[permanent]"]:not(:checked)')?.click()
            document.querySelector('[type=submit][value=Login]').click()
        });
        </script>
    <?php
    }
}
return new DDEVLogin();
