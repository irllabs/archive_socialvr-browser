FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    autoconf \
    libtool \
    pkg-config \
    clang-5.0 \
    libgflags-dev \
    libgtest-dev \
    libc++-dev \
    software-properties-common \
    python-dev \
    python-pip \
    python3-dev \
    python3-pip \
    cmake \
    wget \
    curl \
    gpg-agent \
    git \
    vim

ARG USERNAME=sim
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Non-root user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && mkdir -p /home/$USERNAME/.vscode-server /home/$USERNAME/.vscode-server-insiders \
    && chown ${USER_UID}:${USER_GID} /home/$USERNAME/.vscode-server* \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && usermod -a -G audio,video $USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

USER $USERNAME
ENV HOME /home/$USERNAME
WORKDIR $HOME

# Node.js 8 LTS
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo bash - && \
    sudo apt-get update && sudo apt-get install -y \
    nodejs

RUN sudo npm install -g node-gyp
RUN sudo npm install -g grpc --unsafe-perm

ENV DEBIAN_FRONTEND=