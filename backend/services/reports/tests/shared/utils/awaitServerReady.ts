import * as request from 'request-promise';

export async function awaitServerReady(uri: string) {

  const check = async () => {
    const reply = await request(uri)
      .then(() => true)
      .catch(() => false);
    if (!reply) await check();
  };

  await check();
}
