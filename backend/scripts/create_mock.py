import netCDF4 as nc
import numpy as np
import os

os.makedirs('backend/data', exist_ok=True)
ds = nc.Dataset('backend/data/mock.nc', 'w', format='NETCDF4')
ds.title = 'Mock ARGO Profile'
ds.createDimension('N_PROF', 1)
ds.createDimension('N_LEVELS', 10)
ds.createDimension('STRING8', 8)

platform = ds.createVariable('platform_number', 'S1', ('N_PROF', 'STRING8'))
pres = ds.createVariable('PRES', 'f4', ('N_PROF', 'N_LEVELS'))
temp = ds.createVariable('TEMP', 'f4', ('N_PROF', 'N_LEVELS'))
psal = ds.createVariable('PSAL', 'f4', ('N_PROF', 'N_LEVELS'))

platform[0, :] = list('2900018 ')
pres[0, :] = np.linspace(10, 1000, 10)
temp[0, :] = np.linspace(25, 4, 10)
psal[0, :] = np.linspace(35.2, 34.5, 10)

ds.close()
print("Created backend/data/mock.nc")
