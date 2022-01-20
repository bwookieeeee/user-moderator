# User Moderator

Digital crowd control for [Remo.TV](https://remo.tv) via [Discord.](https://discord.gg/dhkCweA)

User Moderator tracks every login event to Discord via a secure internal
websocket and reports them to Discord for our moderators to review. It
additionally stores usernames and IP addresses to a database to track if they've
been banned; and if they have, their severity.

## Login Reporting

Any time someone who is logged in connects to Remo, a login event is triggered
over a private, password-protected websocket that is separate from the main
socket. A small set of information about your connection and web browser is sent
to the bot which reports it to Discord, and updates its databases accordingly.

[![User Login Report](https://media.discordapp.net/attachments/932748829822943262/932795034959511572/unknown.png)]()

Additionally, action buttons are provided to quickly serve moderation commands
if needed.

An external IP information service is utilized to obtain the country code, ISP,
and proxy. It's capable of differentiating a known VPN address from a Tor address.
Tor addresses are automatically IP banned.

When a login event is reported, every tracked IP address for the reporting user
is compared against known IP addresses of banned users. If a match is found, the
bot assumes that the username is an "alt account" and reports it to the moderators.
It will also automatically ban the username depending on the severity of the matched
accounts' ban. If a banned match with a high severity ban is detected, the account
logging is is also issued a high severity ban.

## Username & IP Address Tracking

The bot doesn't save everything that it reports during a login event. A PSQL
database with two tables named `users` and `ips` is used:

1. `users`
   - `username` - The username of the user logging in.
   - `ips` - An array of every unique IP address the user has logged in with.
   - `banned` - A boolean flag on if the username has been banned.
   - `prejudiced` - A boolean flag representing a high severity ban.
1. `ips`
   - `ip` - The IP address to track.
   - `banned` - A boolean flag on if the IP address has been banned.
   - `prejudiced` - A boolean flag representing a high severity ban.

When a user logs in, an entry in each table is created or upserted where
necessary, such as a new user logging in, a known user logging in with a new IP
address, etc.

## Banning and Severity
There are two different types of bans that this bot can issue. A low severity
ban, or a high severity ban - called a "prejudiced" ban. A normal ban would
typically be used for offenders who are unlikely to try to retaliate, an offensive
username, or an IP address associated with Tor. The bot will not usually take 
automatic action against these (except auto-banning Tor addresses) kinds of bans.

The high severity, "prejudiced" ban is used for users who are likely to attempt
to create new accounts to dodge their ban. When someone logs into Remo on an
account that matches another with a prejudiced ban, the username and IP address
are automatically issued a prejudiced ban. For most cases, this will stop all
but the most determined offenders.

A planned feature called "nuke" works almost exactly like a prejudiced ban, but
also issues prejudiced bans for all users (even unbanned accounts) and IP addresses
associated with the one that was nuked. 

## "Slash" Commands
Three slash commands are available to the highest ranking roles on the Remo
Discord server:

1. `/ban target: username/ip prejudiced: boolean` - Will ban a username or IP
address, with an optional prejudiced flag to issue a high severity ban.
1. `/unban target: username/ip` - Will unban a username or IP address. Unbanning
a prejudiced ban also drops the prejudice. 
1. `/massban target: all/users/ips` - Bans all users and/or IP addresses that are
banned in the bots database. An optional target flag is made available to only ban
usernames or IP addresses. Omitting the target defaults to both.

Slash commands can be issued anywhere in the guild, and replies are ephemeral,
meaning that only the issuer will see them. Special notifications are sent to
a moderation logging channel as well.

---

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.digitaloceanspaces.com/WWW/Badge%203.svg)](https://www.digitalocean.com/?refcode=6a5e47418591&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source)
