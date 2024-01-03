#!/bin/bash
set -eu

# Title: secrets.sh
# Description: This script performs encryption and decryption operations on a target file.
# Use the `SECRET_KEY` value of the appropriate Silta context environment variable as the password.
# Use the CircleCI deployment with SSH to access the `SECRET_KEY` value.

# This function prints the usage message and exits with an error code.
usage() {
    echo "Usage: $0 {edit|decrypt|encrypt} {target}"
    echo "Edit example: lando secrets edit silta/secrets (uses vim editor)"
    echo "Decryption example: lando secrets decrypt silta/secrets"
    echo "Encryption example (note the mandatory .plain extension): lando secrets encrypt silta/secrets.plain"
    exit 1
}

# This function checks if the target file exists and exits with an error code if not.
check_files() {
  if [ ! -f "$1" ]; then
    echo "$1 does not exist."
    exit 1
  fi
}

# This function decrypts the target file, opens it in vim for editing, and encrypts it again after saving.
edit_file() {
    check_files "$2" # Check if the target file exists
    openssl enc -d -aes-256-cbc -pbkdf2 -in "$2" -out "$2.plain" -pass pass:"$ssl_pass" # Decrypt the target file and save it as .plain
    vim "$2.plain" # Open the decrypted file in vim
    openssl aes-256-cbc -pbkdf2 -in "$2.plain" -out "$2" -pass pass:"$ssl_pass" # Encrypt the edited file and overwrite the original target file
    rm "$2.plain" # Remove the decrypted file
}

# This function decrypts the target file and saves it as .plain.
decrypt_file() {
    check_files "$2" # Check if the target file exists
    openssl enc -d -aes-256-cbc -pbkdf2 -in "$2" -out "$2.plain" -pass pass:"$ssl_pass" # Decrypt the target file and save it as .plain
    echo "Decrypted into $2.plain" # Print a message
}

# This function encrypts the target file and overwrites the original file.
encrypt_file() {
    check_files "$2" # Check if the target file exists
    echo "Encrypting..." # Print a message
    filename=$(basename "$2") # Extract the file name from the path
    extension=${filename##*.} # Extract the file extension from the file name
    path="$2" # Store the path in a variable
    name=${path%.*} # Remove the file extension from the file name
    if [ "$extension" != "plain" ]; then # Check if the file extension is not .plain
        echo 'You must use the mandatory .plain extension for the decrypted file.'
        usage
        exit 1
    fi
    openssl aes-256-cbc -pbkdf2 -in "$2" -out "$name" -pass pass:"$ssl_pass" # Encrypt the target file and overwrite the original file
    rm "$2" # Remove the decrypted file
    echo "Encrypted into $name" # Print a message
}

# This block checks the number of arguments and the first argument, and calls the appropriate function
if [[ $# -ne 2 ]]; then # If the number of arguments is not 2, print an error message and the usage message
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
