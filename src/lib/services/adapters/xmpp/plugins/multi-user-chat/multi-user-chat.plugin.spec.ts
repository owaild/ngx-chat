import {filter, first, map} from 'rxjs/operators';
import {Direction} from '../../core/message';
import {Affiliation} from './affiliation';
import {Role} from './role';
import {OccupantNickChange} from './occupant-change';
import {Invitation} from './invitation';
import {LogInRequest} from '../../../../../core/log-in-request';
import {firstValueFrom} from 'rxjs';
import {XmppServiceModule} from '../../../xmpp.service.module';
import {XmppService} from '../../../xmpp.service';
import {EjabberdClient} from '../../../../../test/ejabberd-client';
import {JID, parseJid} from '../../core/jid';

const domain = 'local-jabber.entenhausen.pazz.de';
const service = 'wss://' + domain + ':5280/websocket';

const romeoLogin: LogInRequest = {
    domain,
    service,
    username: 'romeo',
    password: 'JULIA4EVAR'
};

const juliaLogin: LogInRequest = {
    domain,
    service,
    username: 'julia',
    password: 'JULIA4EVAR'
};

const ghostLogin: LogInRequest = {
    domain,
    service,
    username: 'ghost',
    password: 'ghost'
};

const romeoJID = parseJid(romeoLogin.username + '@' + romeoLogin.domain);
const juliaJID = parseJid(romeoLogin.username + '@' + romeoLogin.domain);
const ghostJID = parseJid(romeoLogin.username + '@' + romeoLogin.domain);

function roomIdToJid(id: string): JID {
    return parseJid(id + '@' + 'conference.' + romeoLogin.domain);
}

describe('multi user chat plugin', () => {

    let chatService: XmppService;
    let client: EjabberdClient;

    const createRoomConfig = (roomId: string) => ({
        roomId,
        public: false,
        membersOnly: true,
        nonAnonymous: true,
        persistentRoom: false,
    });

    const romeosRoom = createRoomConfig('romeos-room');
    const juliaRoom = createRoomConfig('juliaRoom');

    const firstRoom = createRoomConfig('firstRoom');
    const secondRoom = createRoomConfig('secondRoom');
    const thirdRoom = createRoomConfig('thirdRoom');

    const currentRoomCount = async () => await firstValueFrom(chatService.rooms$.pipe(map(arr => arr.length)));

    beforeAll(async () => {
        const {xmppService, ejabberdClient} = XmppServiceModule.configureTestingModule();
        chatService = xmppService;
        client = ejabberdClient;

        await client.cleanUpJabber(domain);
        await client.register(romeoLogin);
        await client.register(juliaLogin);
        await client.register(ghostLogin);
    }, 15000);

    describe('room creation', () => {
        it('should throw if user tries to create the same room multiple times', async () => {
            await chatService.logIn(romeoLogin);
            await chatService.createRoom(romeosRoom);

            try {
                await chatService.createRoom(romeosRoom);
                fail('should have thrown');
            } catch (e) {
                expect(e.message).toContain('can not join room more than once');
            }

            await chatService.destroyRoom(roomIdToJid(romeosRoom.roomId));
            await chatService.logOut();
        });

        it('should throw if another user already created the room', async () => {
            await chatService.logIn(romeoLogin);
            await chatService.createRoom(romeosRoom);
            await chatService.logOut();
            await chatService.logIn(juliaLogin);

            try {
                await chatService.createRoom(romeosRoom);
                fail('should have thrown');
            } catch (e) {
                expect(e.message).toContain('error creating room, user is not owner');
            }

            await chatService.logOut();
            await chatService.logIn(romeoLogin);
            await chatService.destroyRoom(roomIdToJid(romeosRoom.roomId));
            await chatService.logOut();
        });

        it('should throw if room is not configurable', async () => {
            await chatService.logIn(romeoLogin);

            const existingRoom = createRoomConfig('existingRoom');

            try {
                await chatService.getRoomConfiguration(roomIdToJid(existingRoom.roomId));
                await chatService.createRoom(existingRoom);

                await chatService.logOut();
                await chatService.logIn(juliaLogin);
                await chatService.getRoomConfiguration(roomIdToJid(existingRoom.roomId));
                fail('should have thrown');
            } catch (e) {
                expect(e.message).toContain('Owner privileges required');
            }

            await chatService.logOut();
            await chatService.logIn(romeoLogin);
            await chatService.destroyRoom(roomIdToJid(existingRoom.roomId));
        });


        it('should allow users to create and configure rooms', async () => {
            await chatService.logIn(romeoLogin);
            const configTestRoom = {
                roomId: 'configTestRoom',
                public: true,
                membersOnly: false,
                nonAnonymous: false,
                persistentRoom: true,
            };

            const room = await chatService.createRoom(configTestRoom);
            expect(room.jid.toString()).toContain(configTestRoom.roomId.toLowerCase());
            const roomConfigForm = await chatService.getRoomConfiguration(roomIdToJid(configTestRoom.roomId));
            const roomConfigOnServer = {
                public: roomConfigForm.fields.find(field => field.variable === 'muc#roomconfig_publicroom').value,
                membersOnly: roomConfigForm.fields.find(field => field.variable === 'muc#roomconfig_membersonly').value,
                nonAnonymous: roomConfigForm.fields.find(field => field.variable === 'muc#roomconfig_whois').value === 'anyone',
                persistentRoom: roomConfigForm.fields.find(field => field.variable === 'muc#roomconfig_persistentroom').value,
            };
            expect(roomConfigOnServer.public).toEqual(configTestRoom.public);
            expect(roomConfigOnServer.membersOnly).toEqual(configTestRoom.membersOnly);
            expect(roomConfigOnServer.nonAnonymous).toEqual(configTestRoom.nonAnonymous);
            expect(roomConfigOnServer.persistentRoom).toEqual(configTestRoom.persistentRoom);

            await chatService.destroyRoom(roomIdToJid(configTestRoom.roomId));
            await chatService.logOut();
        });

        it('should be able to create multiple rooms', async () => {
            await client.register(ghostLogin);
            await chatService.logIn(ghostLogin);

            await chatService.createRoom(firstRoom);
            await chatService.createRoom(secondRoom);
            await chatService.createRoom(thirdRoom);

            console.log('3 Rooms created');

            expect(await currentRoomCount()).toEqual(3);

            await chatService.destroyRoom(roomIdToJid(firstRoom.roomId));
            await chatService.destroyRoom(roomIdToJid(secondRoom.roomId));
            await chatService.destroyRoom(roomIdToJid(thirdRoom.roomId));

            await chatService.logOut();
        });

        it('should throw if user is not allowed to create rooms', async () => {
            pending('For this the we need to disallow common users to create rooms on the server');
            await chatService.logIn(romeoLogin);

            const notAllowedRoom = createRoomConfig('notAllowed');
            try {
                await chatService.createRoom(notAllowedRoom);
                fail('should have thrown');
            } catch (e) {
                expect(e.message).toContain('Not allowed for user');
            }

            await chatService.logOut();
        });
    });

    describe('room joining', () => {

        const createRoomsAsGhost = async () => {
            await chatService.logIn(ghostLogin);

            await chatService.createRoom(firstRoom);
            await chatService.createRoom(secondRoom);
            await chatService.createRoom(thirdRoom);

            expect(await currentRoomCount()).toEqual(3);
            await chatService.logOut();
        };

        const destroyRoomAsGhost = async () => {
            await chatService.logIn(ghostLogin);

            await chatService.destroyRoom(roomIdToJid(firstRoom.roomId));
            await chatService.destroyRoom(roomIdToJid(secondRoom.roomId));
            await chatService.destroyRoom(roomIdToJid(thirdRoom.roomId));

            // expect(await currentRoomCount()).toEqual(0);
            await chatService.logOut();
        };

        const joinGhostRoomsAsRomeo = async () => {
            await chatService.logIn(romeoLogin);

            expect(await currentRoomCount()).toEqual(0);
            await chatService.joinRoom(roomIdToJid(firstRoom.roomId));
            expect(await currentRoomCount()).toEqual(1);
            await chatService.joinRoom(roomIdToJid(secondRoom.roomId));
            expect(await currentRoomCount()).toEqual(2);
            await chatService.joinRoom(roomIdToJid(thirdRoom.roomId));
            expect(await currentRoomCount()).toEqual(3);
        };

        it('should be able to join multiple rooms', async () => {
            await createRoomsAsGhost();

            await joinGhostRoomsAsRomeo();
            await chatService.logOut();

            await destroyRoomAsGhost();
        });

        it('should be able to leave all rooms', async () => {
            await chatService.logIn(romeoLogin);
            expect(await currentRoomCount()).toEqual(0);
            await chatService.logOut();

            await createRoomsAsGhost();

            await joinGhostRoomsAsRomeo();

            expect(await currentRoomCount()).toEqual(3);
            await chatService.leaveRoom(roomIdToJid(firstRoom.roomId));
            expect(await currentRoomCount()).toEqual(2);
            await chatService.leaveRoom(roomIdToJid(secondRoom.roomId));
            expect(await currentRoomCount()).toEqual(1);
            await chatService.leaveRoom(roomIdToJid(thirdRoom.roomId));
            expect(await currentRoomCount()).toEqual(0);
            await chatService.logOut();

            await destroyRoomAsGhost();
        });

        it('should be able to query only for rooms joined', async () => {
            pending('Needs the bookmark plugin implementation');
            await createRoomsAsGhost();
            await joinGhostRoomsAsRomeo();
            await chatService.logOut();

            await chatService.logIn(juliaLogin);
            await chatService.createRoom(juliaRoom);
            await chatService.logOut();

            await chatService.logIn(romeoLogin);
            await chatService.createRoom(romeosRoom);


            const queriedRooms = await chatService.queryAllRooms();
            const gotRooms = await chatService.getRooms();
            const subscriptions = await chatService.plugins.pubSub.getSubscriptions();

            expect(queriedRooms.length).toEqual(4);
            expect(gotRooms.length).toEqual(4);
            expect(subscriptions.length).toEqual(4);

            await chatService.destroyRoom(roomIdToJid(romeosRoom.roomId));
            await chatService.logOut();
            await chatService.logIn(juliaLogin);
            await chatService.destroyRoom(roomIdToJid(juliaRoom.roomId));
            await chatService.logOut();
            await destroyRoomAsGhost();
        });

        it('should be able to keep the rooms when logging out and and in', async () => {
            pending('Needs the bookmark plugin implementation');
            // await createRoomsAsGhost();
            await joinGhostRoomsAsRomeo();

            await chatService.logOut();
            expect(await currentRoomCount()).toEqual(0);

            await chatService.logIn(romeoLogin);
            expect(await currentRoomCount()).toEqual(3);
            // await chatService.logOut();
            // await destroyRoomAsGhost();
        });
    });

    describe('room messaging', () => {

        it('should be able to receive messages', async () => {
            const newRoom = createRoomConfig('chatroom');
            const message = 'message content here';

            await chatService.logIn(romeoLogin);

            const roomsBeforeJoin = await firstValueFrom(chatService.rooms$);
            const expectedRoomCount = roomsBeforeJoin.length++;
            const room = await chatService.createRoom(newRoom);
            const roomsAfterJoin = await firstValueFrom(chatService.rooms$);

            expect(expectedRoomCount).toEqual(roomsAfterJoin.length);

            await chatService.inviteUserToRoom(juliaJID, room.jid);
            await chatService.logOut();

            await chatService.logIn(juliaLogin);
            // TODO: accept user room invite?
            await chatService.joinRoom(room.jid);
            const juliaRooms = await firstValueFrom(chatService.rooms$);
            const joinedRoom = juliaRooms.find(room => room.jid.equals(room.jid));
            await chatService.sendMessage(joinedRoom, message);
            await chatService.logOut();

            await chatService.logIn(romeoLogin);
            const receivedMessage = await firstValueFrom(roomsAfterJoin[0].messages$);
            expect(receivedMessage.body).toEqual(message);
        });

        it('should be able to send messages', async () => {
            // when
            const myOccupantJid = parseJid('chatroom@conference.example.com/me');
            const room = await chatService.joinRoom(myOccupantJid);
            await chatService.sendMessage(room, 'message body');

            // then
            expect(room.messages.length).toEqual(1);
            expect(room.messages[0].body).toEqual('message body');
            expect(room.messages[0].direction).toEqual(Direction.out);
            expect(room.messages[0].id).not.toBeUndefined();
            expect(room.messages[0].from).toEqual(myOccupantJid);
        });
    });

    describe('room operations handling', () => {

        it('should handle kicked occupant and leave room', async (resolve) => {
            const otherOccupantJid = parseJid('chatroom@conference.example.com/other');

            const room = await chatService.joinRoom(otherOccupantJid);
            const rooms = await firstValueFrom(chatService.rooms$);

            expect(rooms.length).toEqual(1);

            room.onOccupantChange$.pipe(
                filter(({change}) => change === 'kicked'),
            ).subscribe(async ({occupant}) => {
                expect(occupant.nick).toEqual(otherOccupantJid.resource);
                expect(occupant.role).toEqual(Role.none);
                expect(occupant.affiliation).toEqual(Affiliation.none);
                expect((await firstValueFrom(chatService.rooms$)).length).toEqual(0);
                resolve();
            });
            await chatService.kickOccupant(otherOccupantJid.resource, room.jid);
        });

        it('should handle banned occupant', async (resolve) => {
            const otherOccupantJid = parseJid('chatroom@conference.example.com/other');

            const room = await chatService.joinRoom(otherOccupantJid);

            room.onOccupantChange$.pipe(
                filter(({change}) => change === 'banned'),
            ).subscribe(({occupant}) => {
                expect(occupant.nick).toEqual(otherOccupantJid.resource);
                expect(occupant.role).toEqual(Role.none);
                expect(occupant.affiliation).toEqual(Affiliation.outcast);
                resolve();
            });
            await chatService.banUserForRoom(otherOccupantJid, parseJid('chatroom@conference.example.com'));
        });

        it('should handle unban occupant', async () => {
            const otherOccupantJid = 'chatroom@conference.example.com/other';
            const roomJid = 'chatroom@conference.example.com';

            await chatService.banUserForRoom(parseJid(otherOccupantJid), parseJid(roomJid));
            let banList = await chatService.queryRoomUserList(parseJid(roomJid));
            expect(banList.length).toEqual(1);
            await chatService.unbanUserForRoom(parseJid(otherOccupantJid), parseJid(roomJid));
            banList = await chatService.queryRoomUserList(parseJid(roomJid));
            expect(banList.length).toEqual(0);
        });

        it('should be able to invite user', async (resolve) => {
            const myOccupantJid = parseJid('me@example.com/something');
            const otherOccupantJid = parseJid('other@example.com/something');
            const roomJid = parseJid('chatroom@conference.example.com');

            chatService.onInvitation$.subscribe((invitation: Invitation) => {
                expect(invitation.type).toEqual('invite');
                expect(invitation.roomJid).toEqual(roomJid);
                expect(invitation.from).toEqual(myOccupantJid);
                expect(invitation.message).toEqual('reason');
                resolve();
            });
            await chatService.inviteUserToRoom(otherOccupantJid, roomJid);
        });

        it('should be able to change nick', async (resolve) => {
            const myOccupantJid = parseJid('chatroom@conference.example.com/something');
            const room = await chatService.joinRoom(myOccupantJid);

            room.onOccupantChange$.pipe(
                filter(({change}) => change === 'changedNick'),
            ).subscribe(({occupant, newNick}: OccupantNickChange) => {
                expect(newNick).toEqual('newNick');
                expect(occupant.jid.toString()).toEqual(myOccupantJid.toString());
                resolve();
            });

            await chatService.changeUserNicknameForRoom('newNick', room.jid);
        });

        it('should be able to change room topic', async () => {
            const roomJid = parseJid('chatroom@conference.example.com');
            const room = await chatService.joinRoom(roomJid);

            const newSubject = 'new subject';

            await chatService.changeRoomSubject(room.jid, newSubject);
            const rooms = await chatService.rooms$.pipe(first()).toPromise();
            expect(rooms[0].subject).toEqual(newSubject);
        });
    });
});
