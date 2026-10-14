#ddev-generated
# Install and configure SSH server for remote command execution from agents container

# Ensure signing key is up to date
RUN curl -sSL https://packages.sury.org/php/apt.gpg | gpg --dearmor --batch --yes -o /usr/share/keyrings/deb.sury.org-php.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-php.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list

# Install SSH server
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        openssh-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy custom sshd configuration
COPY sshd_config /etc/ssh/sshd_config

# Generate host keys and register sshd as a supervised service
# Note: supervisord runs as the DDEV user, so sudo is needed for sshd (port 22, host key access)
# /run/sshd is on tmpfs and must be created at runtime
RUN ssh-keygen -A && \
    printf '[program:sshd]\ncommand=sudo bash -c "mkdir -p /run/sshd && chown root:root /run/sshd && chmod 755 /run/sshd && exec /usr/sbin/sshd -D"\nautorestart=true\nstartretries=3\n' \
        > /etc/supervisor/conf.d/sshd.conf
