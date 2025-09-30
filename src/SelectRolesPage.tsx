text-sm leading-5 text-gray-700">
                                  Inventory PO (&amp; Non-PO) Receiver
                                </div>
                                <label className="mt-1 block text-xs text-gray-600">
                                  Ship-to location (required)
                                </label>
                                <input
                                  type="text"
                                  {...register('shipToLocation')}
                                  placeholder="Enter ship-to location"
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('inventoryReturnsReceiver')}
                                className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm leading-5 text-gray-700">
                                Returns Receiver (Interunit &amp; RMA)
                              </span>
                            </label>
                          </div>
                          <div className="p-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('inventoryCostAdjustment')}
                                className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm leading-5 text-gray-700">
                                Inventory Cost Adjustment
                              </span>
                            </label>
                          </div>
                        </div>
              
                        {/* Row 4 */}
                        <div className="grid grid-cols-1 md:grid-cols-3">
                          <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('inventoryMaterialsManager')}
                                className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm leading-5 text-gray-700">
                                Inventory Materials Manager (Mobile Inventory)
                              </span>
                            </label>
                          </div>
                          <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('inventoryDelivery')}
                                className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm leading-5 text-gray-700">
                                Inventory Delivery
                              </span>
                            </label>
                          </div>
                          <div className="p-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                {...register('inventoryInquiryOnly')}
                                className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm leading-5 text-gray-700">
                                Inventory Inquiry Only
                              </span>
                            </label>
                          </div>
                        </div>
              
                        {/* Row 5 (spans all columns) */}
                        <div className="grid grid-cols-1">
                          <div className="p-4">
                            <label className="flex items-start">
                              <input
                                type="checkbox"
                                {...register('inventoryConfigurationAgency')}
                                className="h-4 w-4 shrink-0 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm leading-5 text-gray-700">
                                Inventory Configuration-Agency: This is a very powerful role. It is only for experienced
                                inventory administrators—at most, a few per agency.
                              </span>
                            </label>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
                 
              {/* Special role for the Department of Transportation (DOT) only */}
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mt-6"> 
                <table className="min-w-full divide-y divide-gray-300 table-fixed">
                  <thead className="bg-green-600">
                    <tr>
                      <th
                        colSpan={2}
                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                      >
                        Special role for the Department of Transportation (DOT) only
                      </th>
                    </tr>
                  </thead>
                
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      {/* widen first column */}
                      <td className="px-6 py-4 border-r border-gray-200 w-2/5">
                        <label className="flex items-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            {...register('inventoryPickPlanDistributionRelease')}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Pick Plan Report Distribution (Release)
                          </span>
                        </label>
                      </td>
                    
                      {/* narrower second column */}
                      <td className="px-6 py-4 w-3/5 align-top">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter needed <em>inventory</em> business unit(s)
                          <br />
                          (5 characters each; examples: CS000 for Central Shop, OD000 for Oakdale):
                        </label>
                        <input
                          type="text"
                          {...register('inventoryDotUnits')}
                          className={`${rcInputClasses} w-40`}
                          maxLength={5}
                          placeholder="Enter business unit codes"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
 
              {/* Role Justification */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Role Justification
                </h3>
                <div>
                  <label htmlFor="roleJustification" className="block text-sm font-medium text-gray-700">
                    Please provide justification for the selected roles and permissions
                  </label>
                  <textarea
                    id="roleJustification"
                    {...register('roleJustification')}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="Explain why these specific roles and permissions are needed for this user's job responsibilities..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {saving ? 'Saving...' : 'Save Role Selections'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectRolesPage;