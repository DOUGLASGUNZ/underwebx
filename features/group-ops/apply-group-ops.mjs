import fs from 'node:fs';
import path from 'node:path';

// Runs after OSC Lab 2.0 UI is assembled. No live moderation requests are made
// during installation/build. All moderation actions require an explicit UI click.
const root = path.resolve(process.argv[2] || '.');
const target = path.join(root, 'src/views/UnderWeb/UnderWeb.vue');
let source = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
function replaceOnce(anchor, replacement) {
    if (!source.includes(anchor)) throw new Error('Group Ops: missing expected anchor: ' + anchor.slice(0, 100));
    source = source.replace(anchor, replacement);
}
replaceOnce(
    "    import { UWX_VERSION } from '../../shared/constants/uwx';",
    "    import { groupRequest } from '../../api';\n    import { UWX_VERSION } from '../../shared/constants/uwx';"
);
replaceOnce(
    "        { id: 'osc', label: 'OSC Lab'",
    "        { id: 'moderation', label: 'Group Ops', short: 'Moderate + invite', icon: 'ri-shield-user-line' },\n        { id: 'osc', label: 'OSC Lab'"
);
replaceOnce(
    "        osc: { eyebrow: 'REAL-TIME CONTROL'",
    "        moderation: { eyebrow: 'GROUP OPERATIONS', title: 'Group Moderation', description: 'Review and moderate your current approved VRChat group; invite friends from Command.' },\n        osc: { eyebrow: 'REAL-TIME CONTROL'"
);


// Instance Inviter: manual invites work from any detected VRChat instance.
// Automatic sweeps remain restricted to an explicitly approved group lobby.
const underWebPath = path.join(root, 'src/stores/underweb.js');
let underWeb = fs.readFileSync(underWebPath, 'utf8').replace(/\r\n/g, '\n');
function storeReplace(anchor, replacement) {
    if (!underWeb.includes(anchor)) throw new Error('Group Ops: missing invite anchor: ' + anchor.slice(0, 100));
    underWeb = underWeb.replace(anchor, replacement);
}
storeReplace(
    "const canAutoInviteHere = computed(() => isGroupInstance.value && isCurrentGroupAllowed.value);",
    "const canAutoInviteHere = computed(() => Boolean(currentParsedLocation.value?.isRealInstance && currentLocationTag.value));"
);
storeReplace(
    "const canRecruitHere = computed(() => canAutoInviteHere.value);",
    "const canRecruitHere = computed(() => isGroupInstance.value && isCurrentGroupAllowed.value);"
);
storeReplace(
    "    async function scanAndInvite({ source = 'automatic', force = false } = {}) {",
    "    async function scanAndInvite({ source = 'automatic', force = false } = {}) {\n" +
    "        // Manual invites may target any detected instance, but automated inviting is opt-in for approved group lobbies only.\n" +
    "        if (source !== 'manual' && !isCurrentGroupAllowed.value) return { sent: 0, skipped: 'automatic-invites-require-approved-group' };"
);
fs.writeFileSync(underWebPath, underWeb, 'utf8');

// Keep messaging aligned to the invitation permission boundary.
replaceOnce(
    "This is the old Auto Invite behavior, now named correctly so it is not confused with group recruiting.",
    "Manual invites work in any detected instance. Automatic inviting runs only in explicitly approved group instances."
);
replaceOnce(
    "Invite selected audience into lobby",
    "Invite audience into this instance"
);
replaceOnce(
    "                            <Switch :model-value=\"autoInviteEnabled\" @update:modelValue=\"setAutoInviteEnabled\" />",
    "                            <Switch :model-value=\"autoInviteEnabled\" :disabled=\"!isCurrentGroupAllowed\" @update:modelValue=\"setAutoInviteEnabled\" />"
);

// Keep this area as a manual-only tool. A Group Ban is not an Instance Kick.
// VRChat server validates permissions. The allowlist provides an additional
// voluntary scope restriction so an unexpected group lobby can't be moderated.
const code = [
"    const modTargetUserId = ref('');",
"    const modConfirmation = ref('');",
"    const modLookupBusy = ref(false);",
"    const modActionBusy = ref(false);",
"    const modTargetMember = ref(null);",
"    const modLookupMessage = ref('');\n    const modPreparedGroupId = ref('');",
"    const modLastAction = ref('');",
"    const modGroupId = computed(() => (isGroupInstance.value && isCurrentGroupAllowed.value) ? currentGroupId.value : '');",
"    const modTargetValid = computed(() => /^usr_[A-Za-z0-9-]{8,}$/.test(modTargetUserId.value.trim()));",
"    const modCanAct = computed(() => Boolean(modGroupId.value && modTargetValid.value &&",
"        modConfirmation.value.trim() === modTargetUserId.value.trim() && modPreparedGroupId.value === modGroupId.value && !modActionBusy.value));",
"    function modResetLookup() { modTargetMember.value = null; modLookupMessage.value = ''; modConfirmation.value = ''; modPreparedGroupId.value = ''; }",
"    async function modLookupMember() {",
"        const groupId = modGroupId.value;",
"        const userId = modTargetUserId.value.trim();",
"        if (!groupId || !modTargetValid.value) { toast.error('Enter a VRChat user ID inside an approved group instance.'); return; }",
"        modLookupBusy.value = true;",
"        modResetLookup();",
"        try {",
"            const response = await groupRequest.getGroupMember({ groupId, userId });",
"            if (groupId !== modGroupId.value || userId !== modTargetUserId.value.trim()) return;",
"            modTargetMember.value = response?.json || response?.ref || null;\n            if (modTargetMember.value) modPreparedGroupId.value = groupId;",
"            modLookupMessage.value = modTargetMember.value ? 'Current group membership confirmed.' : 'No group member details returned.';",
"        } catch (error) {",
"            const status = error?.status || error?.statusCode || error?.response?.status;",
"            if (groupId !== modGroupId.value || userId !== modTargetUserId.value.trim()) return;\n            if (status === 404) modPreparedGroupId.value = groupId;\n            modLookupMessage.value = status === 404 ? 'This user is not currently a group member.' :",
"                status === 403 ? 'Your account cannot read group membership.' : 'Member lookup failed. No changes were made.';",
"        } finally { modLookupBusy.value = false; }",
"    }",
"    async function modTakeAction(action) {",
"        if (!['remove', 'ban', 'unban'].includes(action) || !modCanAct.value) {",
"            toast.error('Confirm the exact target user ID before taking a moderation action.'); return;",
"        }",
"        const groupId = modGroupId.value;",
"        const userId = modTargetUserId.value.trim();",
"        // No remote moderation can be triggered by Safety Intel, watch events, or scans.",
"        if (!groupId || !modTargetValid.value || !isCurrentGroupAllowed.value || modActionBusy.value) return;",
"        modActionBusy.value = true;",
"        try {",
"            if (groupId !== modGroupId.value || userId !== modTargetUserId.value.trim()) throw new Error('Group or target changed.');",
"            if (action === 'remove') {",
"                // Check membership before removal; do not conflate group removal with an instance kick.",
"                const lookup = await groupRequest.getGroupMember({ groupId, userId });",
"                if (!lookup?.json) throw new Error('Group membership could not be verified.');",
"                if (groupId !== modGroupId.value) throw new Error('Group instance changed.');",
"                await groupRequest.kickGroupMember({ groupId, userId });",
"            } else if (action === 'ban') {",
"                await groupRequest.banGroupMember({ groupId, userId });",
"            } else {",
"                await groupRequest.unbanGroupMember({ groupId, userId });",
"            }",
"            modLastAction.value = action.toUpperCase() + ': ' + userId + ' in ' + groupId;",
"            toast.success(action === 'remove' ? 'Member removed from VRChat group.' : action === 'ban' ? 'User banned from VRChat group.' : 'User unbanned from VRChat group.');",
"            modResetLookup();",
"        } catch (error) {",
"            const status = error?.status || error?.statusCode || error?.response?.status;",
"            toast.error(status === 403 ? 'VRChat denied this action: check your group role permissions.' :",
"                status === 429 ? 'VRChat rate limit reached: wait before retrying.' : error?.message || 'VRChat moderation request failed.');",
"        } finally { modActionBusy.value = false; modConfirmation.value = ''; }",
"    }"
].join('\n');
replaceOnce("    const groupInput = ref('');", code + "\n    const groupInput = ref('');");

// Disarm both invitation tools immediately (without modifying the group allowlist).
replaceOnce(
    "                            Invite {{ eligibleLobbyRecruits.length }} eligible to group",
    "                            Invite {{ eligibleLobbyRecruits.length }} eligible to group"
);
const moderationCard = `
            <Card v-show="activePanel === 'moderation'" class="uwx-card uwx-card-wide">
                <CardHeader>
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <CardTitle>Group Moderation</CardTitle>
                            <CardDescription>Manual member actions. VRChat verifies your permissions.</CardDescription>
                        </div>
                        <Badge variant="outline">NO AUTO-ENFORCEMENT</Badge>
                    </div>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="uwx-warning">
                        Group: <strong>{{ modGroupId || 'Enter an approved group instance first' }}</strong>.
                        UWX never acts on Safety Intel flags automatically.
                        <strong>Remove Member</strong> removes a person from the VRChat group, not just your current instance.
                        Instance-only warnings and kicks remain available in VRChat's in-game moderation menu.
                    </div>
                    <div class="flex flex-wrap gap-2 items-center">
                        <Input v-model="modTargetUserId" class="flex-1 min-w-[220px]" placeholder="usr_… VRChat user ID"
                            :disabled="!modGroupId || modActionBusy" @input="modResetLookup" />
                        <Button variant="outline" :disabled="!modGroupId || !modTargetValid || modLookupBusy || modActionBusy"
                            @click="modLookupMember">{{ modLookupBusy ? 'Checking…' : 'Check member' }}</Button>
                    </div>
                    <p v-if="modLookupMessage" class="uwx-help">{{ modLookupMessage }}</p>
                    <p v-if="modTargetMember" class="uwx-help">Member:
                        {{ modTargetMember.user?.displayName || modTargetMember.displayName || modTargetUserId }}
                    </p>
                    <div class="uwx-premium-panel">
                        <strong>Confirm the person, not just the button.</strong>
                        <p class="uwx-help mt-1">Check member first, then paste the exact user ID above into the confirmation field to unlock actions.
                            These actions take effect immediately on VRChat. There is no bulk moderation.</p>
                        <Input v-model="modConfirmation" class="mt-3" placeholder="Repeat target usr_… to confirm"
                            :disabled="!modGroupId || !modTargetValid || modActionBusy" />
                        <div class="flex flex-wrap gap-2 mt-3">
                            <Button variant="outline" :disabled="!modCanAct || !modTargetMember"
                                @click="modTakeAction('remove')">Remove group member</Button>
                            <Button variant="destructive" :disabled="!modCanAct"
                                @click="modTakeAction('ban')">Ban from group</Button>
                            <Button variant="outline" :disabled="!modCanAct"
                                @click="modTakeAction('unban')">Unban from group</Button>
                        </div>
                    </div>
                    <p v-if="modLastAction" class="uwx-help">Last successful action: {{ modLastAction }}</p>
                </CardContent>
            </Card>
`;
replaceOnce("            <Card v-show=\"activePanel === 'system'\" class=\"uwx-card\">", moderationCard + "\n            <Card v-show=\"activePanel === 'system'\" class=\"uwx-card\">");
fs.writeFileSync(target, source, 'utf8');
console.log('Applied manual group moderation panel, with group allowlist and typed target confirmation.');
