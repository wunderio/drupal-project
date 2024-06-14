# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.187.0/containers/codespaces-linux/.devcontainer/base.Dockerfile

FROM mcr.microsoft.com/vscode/devcontainers/universal:1-focal

# ** [Optional] Uncomment this section to install additional packages. **
# USER root
#
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>
#
# USER codespace

# Install Lando without having docker-ce as hard-dependency
USER root
RUN wget https://files.devwithlando.io/lando-stable.deb && dpkg -i --ignore-depends=docker-ce lando-stable.deb && usermod -aG docker codespace
USER codespace
