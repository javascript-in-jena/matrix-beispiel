/*!
 * @license MIT
 */

import { logger } from 'bs-logger';
import * as config from 'config';
import { Client } from './sdk';

if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV === '') {
    process.env.NODE_ENV = 'development';
}

// tslint:disable-next-line
(async function() {
    try {
        logger('Starting up…');
        const client = new Client(config.get('server'));
        logger('Logging in…');
        await client.loginWithCredentials (
            config.get('credentials.username'),
            config.get('credentials.password'),
        );
        logger('Successfully logged in…');
        const rooms = await client.getPublicRooms({
            server: 'matrix.org',
            limit: 10,
            searchTerm: 'Javascript in Jena',
        });

        logger('Successfully fetch channel information');

        const jsInJena =
            rooms
            .chunk
            .filter(
                item => typeof item.canonical_alias === 'string' ?
                    item.canonical_alias.includes('#JSinJena:matrix.org') :
                    false,
                   )
            .pop();
        if (typeof jsInJena === 'undefined') {
            throw new Error('Channel not found');
        }

        logger(`joining ${jsInJena.room_id}`);
        await client.joinRoom(jsInJena.room_id);

        logger('Obtain list of joined rooms');
        const joinedRooms = await client.getJoinedRooms();

        logger('rooms', joinedRooms);

        await client.logout();
        logger('Successfully logged out');
        process.exit(0);
    } catch (error) {
        logger('An error happened', {
            name: error.name,
            stack: error.stack,
            error,
        });
        process.exit(0);
    }
})();
