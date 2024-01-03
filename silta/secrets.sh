#!/bin/bash
set -eu

# Title: secrets.sh
# Description: This script performs encryption and decryption operations on a target file.
# Usage: `./secrets.sh {edit|decrypt|encrypt} {target}`.
# Usage: Use the `SECRET_KEY` value of the appropriate context environment variable as the password.
# Usage: Use the CircleCI deployment with SSH to access the `SECRET_KEY`` value.
# Example: ./secrets.sh edit secret.txt

# This function prints the usage message and exits with an error code.
usage() {
    echo "Usage: $0 {edit|decrypt|encrypt} {target}"
    echo "Example with secrets.sh: $0 decrypt silta/secrets"
    echo "Example with Lando: lando secrets decrypt silta/secrets"
    exit 1
}

# This function checks if the target file exists and exits with an error code if not.
check_files() {
  if [ ! -f "$1" ]; then
    echo "$1 does not exist."
    echo "Run 'touch $1' to create a target file first."
    exit 1
  fi
}

# This function decrypts the target file, opens it in vim for editing, and encrypts it again after saving.
edit_file() {
    check_files $2 # Check if the target file exists
    openssl enc -d -aes-256-cbc -pbkdf2 -in $2 -out $2.dec -pass pass:$ssl_pass # Decrypt the target file and save it as .dec
    vim $2.dec # Open the decrypted file in vim
    openssl aes-256-cbc -pbkdf2 -in $2.dec -out $2 -pass pass:$ssl_pass # Encrypt the edited file and overwrite the original target file
    rm $2.dec # Remove the decrypted file
}

# This function decrypts the target file and saves it as .dec.
decrypt_file() {
    check_files $2 # Check if the target file exists
    openssl enc -d -aes-256-cbc -pbkdf2 -in $2 -out $2.dec -pass pass:$ssl_pass # Decrypt the target file and save it as .dec
    echo "Decrypted into $2.dec" # Print a message
}

# This function encrypts the target file and overwrites the original file.
encrypt_file() {
    check_files $2 # Check if the target file exists
    echo "Encrypting..." # Print a message
    cp $2 $2.dec # Copy the target file and save it as .dec
    openssl aes-256-cbc -pbkdf2 -in $2.dec -out $2 -pass pass:$ssl_pass # Encrypt the target file and overwrite the original file
    rm $2.dec # Remove the decrypted file
    echo "Encrypted into $2" # Print a message
}

# This block checks the number of arguments and the first argument, and calls the appropriate function
if [[ $# -ne 2 ]] ; then # If the number of arguments is not 2, print an error message and the usage message
    echo 'You need to pass 2 arguments.'
    usage
    exit 1
fi

read -sp "Password for $2: " ssl_pass # Prompt the user for the password and store it in a variable
echo

case $1 in # Check the first argument and call the corresponding function

  edit) # If the first argument is edit, call the edit_file function
    edit_file $1 $2 ssl_pass
    ;;

  decrypt) # If the first argument is decrypt, call the decrypt_file function
    decrypt_file  $1 $2 ssl_pass
    ;;

  encrypt) # If the first argument is encrypt, call the encrypt_file function
    encrypt_file  $1 $2 ssl_pass
    ;;

  *) # If the first argument is anything else, print an error message and the usage message
    echo -n "Don't know what to do with this input..."
    echo
    usage
    ;;
esac
