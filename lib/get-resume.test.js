import getResume from './get-resume';
import { stdin as mockStdin } from 'mock-stdin';

jest.mock('fs', () => {
  const dedent = require('dedent');
  const flat = require('flat');
  const { Volume, createFsFromVolume } = require('memfs');
  return createFsFromVolume(
    Volume.fromJSON(
      flat(
        {
          'resume.json': JSON.stringify({
            basics: {
              name: 'thomas',
              email: 'thomas@example.com',
            },
          }),
          'resume.yaml': dedent`
          basics: 
            name: thomas
            email: thomas@example.com
        `,
          quaff: {
            'basics.yaml': dedent`
            name: thomas
            email: thomas@example.com
          `,
            'work.json': JSON.stringify([
              {
                company: 'Pied Piper',
                endDate: '2014-12-01',
                position: 'CEO/President',
                startDate: '2013-12-01',
              },
            ]),
          },
        },
        { delimiter: '/' },
      ),
      '/',
    ),
  );
});

describe('get-resume', () => {
  it('should consume yaml', async () => {
    expect(await getResume({ path: '/resume.yaml' })).toMatchInlineSnapshot(`
      Object {
        "basics": Object {
          "email": "thomas@example.com",
          "name": "thomas",
        },
      }
    `);
  });
  it('should consume json', async () => {
    expect(await getResume({ path: '/resume.json' })).toMatchInlineSnapshot(`
        Object {
          "basics": Object {
            "email": "thomas@example.com",
            "name": "thomas",
          },
        }
      `);
  });
  it('should consume an entire directory as if it were a json object', async () => {
    expect(await getResume({ path: '/quaff' })).toMatchInlineSnapshot(`
      Object {
        "basics": Object {
          "email": "thomas@example.com",
          "name": "thomas",
        },
        "work": Array [
          Object {
            "company": "Pied Piper",
            "endDate": "2014-12-01",
            "position": "CEO/President",
            "startDate": "2013-12-01",
          },
        ],
      }
    `);
  });
  it('should read from process.stdin when path is falsy', async () => {
    const stdin = mockStdin();
    const gotResume = getResume({});
    stdin.send(
      JSON.stringify({
        basics: {
          name: 'thomas',
          email: 'thomas@example.com',
        },
      }),
    );
    stdin.send(null);
    expect(await gotResume).toMatchInlineSnapshot(`
      Object {
        "basics": Object {
          "email": "thomas@example.com",
          "name": "thomas",
        },
      }
    `);
  });
});
