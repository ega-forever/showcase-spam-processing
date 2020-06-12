import { Inject } from 'typedi';
import { DI } from '../constants/DI';
import { Message, PubSub, Subscription } from '@google-cloud/pubsub';
import ISubscriptionResolver from '../interfaces/ISubscriptionResolver';
import Logger = require('bunyan');

export default class SubscriptionCtrl {

  @Inject(DI.services.google.pubsub)
  private readonly googlePubSub: PubSub;

  @Inject(DI.logger)
  private readonly logger: Logger;

  private readonly targets: Map<string, Subscription> = new Map<string, Subscription>();

  public async registerTarget(subscriptionName: string, subscriptionPath: string, topic: string, resolver: ISubscriptionResolver) {

    const [isSubscriptionExist] = await this.googlePubSub.subscription(subscriptionPath).exists();

    const [subscription] = isSubscriptionExist ? await this.googlePubSub.subscription(subscriptionPath).get() :
      await this.googlePubSub.topic(topic).createSubscription(
        subscriptionName,
        { expirationPolicy: null, ackDeadlineSeconds: 30 });

    subscription.on('message', (message: Message) => {
      try {
        resolver.emit(message);
      } catch (e) {
        this.logger.error(e);
        message.nack();
      }
    });
    this.targets.set(subscriptionName, subscription);
  }

}