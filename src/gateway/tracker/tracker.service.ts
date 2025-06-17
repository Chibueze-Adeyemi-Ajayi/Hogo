import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DeliveryService } from 'src/web/delivery/delivery.service';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { log } from 'console';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: "*",
        credentials: true
    }
})
export class TrackerService implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    private logger = new Logger(TrackerService.name);

    constructor(
        @Inject() private readonly deliveryService: DeliveryService
    ) { }

    handleDisconnect(client: Socket) {
        this.logger.log(`A user just connected: ${client.id}`)
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`A user just connected: ${client.id}`)
        client.emit("start", { message: "You are connected to the tracker service" });
    }

    @SubscribeMessage('start')
    async handleConnections(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
        try {

            // this.logger.log()
            let delivery = await this.deliveryService.recipientViewDelivery(payload.sessionId);

            if (!delivery) throw new NotFoundException({ message: "Delivery not found, please confirm the session ID" });

            let data = {}

            if (payload.role == "courier") data["courier_socket_id"] = client.id;
            if (payload.role == "recipient") data["recipient_socket_id"] = client.id;
            if (payload.role == "dispatcher") data["dispatcher_socket_id"] = client.id;

            let tracking = await this.deliveryService.updateTracking(payload.sessionId, data)

            client.emit("start", delivery);

            return delivery;

        } catch (error) { client.emit("error", error.response); }
    }

    @SubscribeMessage('broadcast')
    async handleBroadcast(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
        try {

            let { sessionId, data } = payload;

            let delivery = await this.deliveryService.recipientViewDelivery(sessionId);

            if (!delivery) throw new NotFoundException({ message: "Delivery not found, please confirm the session ID" });

            await this.deliveryService.updateDeliveryFromTracking(delivery, data);

            let tracking = await this.deliveryService.getTracking(sessionId);

            let { courier_socket_id, dispatcher_socket_id, recipient_socket_id } = tracking;

            let new_delivery = await this.deliveryService.recipientViewDelivery(sessionId);

            this.server.to(courier_socket_id).emit("broadcast"), new_delivery;
            this.server.to(dispatcher_socket_id).emit("broadcast", new_delivery);
            this.server.to(recipient_socket_id).emit("broadcast", new_delivery);

            client.emit("broadcast", new_delivery);

        } catch (error) { client.emit("error", error.response); }
    }

}