# Source Registry

Accessed 2026-09-16. “Verified” requires first-party code or explicit first-party configuration. “Estimated” means repeatable public measurement and independent agreement, but no publisher formula. Constants are hipfire values unless stated otherwise.

| ID                 | Game / claim                                        | Source                                                                                                            | Version / assumption                       |
| ------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `source-sdk`       | Source default `m_yaw` lineage and input model      | [Valve Source SDK 2013](https://github.com/ValveSoftware/source-sdk-2013)                                         | Public SDK; game overrides remain possible |
| `valve-commands`   | CS console variables including `m_yaw`              | [Valve Developer Community command list](https://developer.valvesoftware.com/wiki/Console_Command_List)           | Default `0.022`; user-editable             |
| `quake-source`     | Quake `m_yaw` input formula                         | [id Software Quake source](https://github.com/id-Software/Quake/blob/master/WinQuake/cl_input.c)                  | First-party released source                |
| `cs2-msc`          | CS2 independent constant/FOV cross-check            | [mouse-sensitivity.com CS2](https://www.mouse-sensitivity.com/n/cs2/)                                             | Current public profile                     |
| `tarkov-msc`       | EFT measured yaw and FOV behavior                   | [mouse-sensitivity.com EFT](https://www.mouse-sensitivity.com/n/escape-from-tarkov/)                              | Community measurement; no BSG formula      |
| `arena-official`   | Arena product/build boundary                        | [Official Tarkov Arena](https://arena.tarkov.com/)                                                                | No input formula published                 |
| `kovaak-matcher`   | Measurement process, yaw examples, monitor matching | [KovaaK sensitivity matcher](https://www.kovaak.com/sensitivity-matcher/)                                         | Independent reproducible measurement       |
| `kovaak-converter` | KovaaK profile-based scaling                        | [Official KovaaK converter](https://kovaaks.com/kovaaks/sens-converter)                                           | No universal native yaw                    |
| `aimlab-support`   | Aim Lab profile/settings behavior                   | [Aimlabs support](https://support.aimlabs.com/)                                                                   | No public universal yaw formula            |
| `aimlab-msc`       | Aim Lab independent profile cross-check             | [mouse-sensitivity.com Aim Lab](https://www.mouse-sensitivity.com/n/aimlabs/)                                     | Profile-specific                           |
| `valorant-msc`     | Valorant measured `0.07` yaw                        | [mouse-sensitivity.com Valorant](https://www.mouse-sensitivity.com/n/valorant/)                                   | Riot does not publish formula              |
| `apex-msc`         | Apex Source-family scaling and FOV                  | [mouse-sensitivity.com Apex](https://www.mouse-sensitivity.com/n/apex-legends/)                                   | Assumes default config                     |
| `overwatch-msc`    | Overwatch independent `0.0066` cross-check          | [mouse-sensitivity.com Overwatch](https://www.mouse-sensitivity.com/n/overwatch/)                                 | Blizzard does not publish formula          |
| `siege-msc`        | Siege default multiplier-derived yaw                | [mouse-sensitivity.com Siege](https://www.mouse-sensitivity.com/n/rainbow-6-siege/)                               | Assumes multiplier unit `0.02`             |
| `ubisoft-support`  | Siege official support boundary                     | [Ubisoft Siege support](https://www.ubisoft.com/en-us/help/game/rainbow-six-siege)                                | Full derivation not published              |
| `cod-guides`       | Current Call of Duty settings terminology           | [Official Call of Duty guides](https://www.callofduty.com/guides)                                                 | Exact title/build must be checked          |
| `cod-msc`          | Modern IW measured `0.0066` scale                   | [mouse-sensitivity.com MW/Warzone](https://www.mouse-sensitivity.com/n/call-of-duty-modern-warfare-2019-warzone/) | Not franchise-wide                         |
| `fortnite-msc`     | Fortnite displayed-percent yaw scale                | [mouse-sensitivity.com Fortnite](https://www.mouse-sensitivity.com/n/fortnite/)                                   | UI percentage points; not config fraction  |
| `epic-support`     | Fortnite official settings boundary                 | [Epic Fortnite support](https://www.epicgames.com/help/en-US/c-Category_Fortnite)                                 | Formula not published                      |

No proprietary calculator code is copied. Public calculators serve only as independent measurement cross-checks.
