import { Message } from '@google-cloud/pubsub';

export default interface ISubscriptionResolver {

  emit(message: Message): Promise<void>;

}
