using ServiceTRAX.Identity.Authorization;
using ServiceTRAX.Models.DBModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServiceTRAX.Models.ViewModels
{
    public class RolePermissionsMatrix
    {
        public IEnumerable<RolePermissionValue> ColHeaders { get; set; }
        public IEnumerable<PermissionDisplay> RowHeaders { get; set; }
        public Dictionary<Tuple<string, short>, PermissionComparisonResult> HasPermission { get; set; }

        public int DBPermissionCount { get; set; }
        public int CodePermissionCount { get; set; }

        public bool HasIssues
        {
            get
            {
                return HasPermission.ContainsValue(PermissionComparisonResult.NOTSETBUTDIFFERENT)
                        || HasPermission.ContainsValue(PermissionComparisonResult.SETBUTDIFFERENT)
                            || DBPermissionCount != CodePermissionCount;
            }
        }
    }

    public enum PermissionComparisonResult
    {
        SETANDEQUAL,
        NOTSETANDEQUAL,
        SETBUTDIFFERENT,
        NOTSETBUTDIFFERENT
    }

    public static class RolePermissionsMatrixBuilder
    {
        public static RolePermissionsMatrix Build(Dictionary<Tuple<long, int>, bool> DBPermissions)
        {
            var roles = RolePermissions.Values;
            var permissions = PermissionDisplay.GetPermissionsToDisplay(typeof(Permissions));
            var rolePermissionGrid = new Dictionary<Tuple<string, short>, PermissionComparisonResult>();

            foreach (var role in roles)
            {
                foreach (var permission in permissions)
                {
                    rolePermissionGrid.Add(Tuple.Create(role.RoleName, (short)permission.Permission), ComparePermissions(role, permission, DBPermissions)); // role.Permissions.Contains(permission.Permission));
                }
            }

            return new RolePermissionsMatrix
            {
                ColHeaders = roles,
                RowHeaders = permissions,
                HasPermission = rolePermissionGrid,
                DBPermissionCount = DBPermissions.Count(),
                CodePermissionCount = (roles.Select(r => r.Permissions.Count())).Sum()
            };
        }

        private static PermissionComparisonResult ComparePermissions(RolePermissionValue role, PermissionDisplay permission, Dictionary<Tuple<long, int>, bool> DBPermissions)
        {
            var set = role.Permissions.Contains(permission.Permission);
            var dbSet = DBPermissions.ContainsKey(Tuple.Create(role.RoleId, (int)permission.Permission));

            if (set && dbSet) return PermissionComparisonResult.SETANDEQUAL;
            if (!set && !dbSet) return PermissionComparisonResult.NOTSETANDEQUAL;
            if (!set && dbSet) return PermissionComparisonResult.NOTSETBUTDIFFERENT;
            /*if (set && !dbSet) */
            return PermissionComparisonResult.SETBUTDIFFERENT;
        }
    }



    public class PermissionsDisplayViewModel : ServiceTRAXPageViewModel
    {
        public IEnumerable<PermissionDisplay> Permissions { get; set; }
        public string RolePagePermissionsInsertStatements { get; internal set; }
        public RolePermissionsMatrix Matrix { get; set; }
    }
}
