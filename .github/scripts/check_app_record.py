"""Gets an app ready for its first TestFlight upload, before the long build:

1. Registers its bundle ID (e.g. com.marikalam.wordpop) with Apple if it
   isn't registered yet, so it can be picked in App Store Connect.
2. Checks that App Store Connect has an app record for that bundle ID.
   Apple's API can't create one, so if it's missing this stops with the
   steps to make it (a minute in App Store Connect), rather than failing
   at the very end of the build.

Usage: check_app_record.py <AuthKey.p8> <bundle id> <app name>, with
ASC_KEY_ID and ASC_ISSUER_ID in the environment. Prints no secrets.
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from revoke_ci_dev_certs import API, make_token  # noqa: E402


def request(method, url, token, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, method=method, data=data, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def main():
    key_path, bundle_id, name = sys.argv[1], sys.argv[2], sys.argv[3]
    token = make_token(key_path, os.environ['ASC_KEY_ID'], os.environ['ASC_ISSUER_ID'])
    q = urllib.parse.quote(bundle_id)

    found = request('GET', f'{API}/bundleIds?filter[identifier]={q}&limit=5', token)['data']
    if any(b['attributes']['identifier'] == bundle_id for b in found):
        print(f'Bundle ID {bundle_id} is registered.')
    else:
        request('POST', f'{API}/bundleIds', token, {'data': {'type': 'bundleIds', 'attributes': {'identifier': bundle_id, 'name': name, 'platform': 'IOS'}}})
        print(f'Registered bundle ID {bundle_id}.')

    apps = request('GET', f'{API}/apps?filter[bundleId]={q}&limit=5', token)['data']
    if any(a['attributes']['bundleId'] == bundle_id for a in apps):
        print(f'App Store Connect has the {name} app. Ready to build.')
        return
    print(
        f'\n::error::App Store Connect has no app for {bundle_id} yet.\n'
        f'Make it once: appstoreconnect.apple.com -> Apps -> + -> New App.\n'
        f'  Platform: iOS   Name: {name}   Primary language: English (U.S.)\n'
        f'  Bundle ID: {bundle_id} (registered just now, so it is in the list)\n'
        f'  SKU: {bundle_id.split(".")[-1]}   User access: Full Access\n'
        f'Then run this workflow again (Actions tab -> Run workflow).'
    )
    sys.exit(1)


if __name__ == '__main__':
    main()
