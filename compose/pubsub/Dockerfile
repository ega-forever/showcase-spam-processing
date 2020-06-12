FROM google/cloud-sdk:290.0.1-alpine
ENV DATA_DIR "/opt/pubsub"
ENV HOST_PORT 8085

RUN apk --update add openjdk8-jre netcat-openbsd && gcloud components install --quiet beta pubsub-emulator && \
 mkdir -p ${DATA_DIR}

CMD [ "sh", "-c", "gcloud beta emulators pubsub start --host-port=0.0.0.0:${HOST_PORT} --log-http --verbosity=debug --user-output-enabled --data-dir ${DATA_DIR}"]